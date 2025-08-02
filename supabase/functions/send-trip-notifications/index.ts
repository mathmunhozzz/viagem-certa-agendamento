import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Gmail SMTP sending function using native SMTP connection
const sendGmailNotification = async (to: string, subject: string, html: string) => {
  const gmailEmail = Deno.env.get('GMAIL_EMAIL');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailEmail || !gmailPassword) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD secrets.');
  }

  console.log(`📧 Connecting to Gmail SMTP for ${to}...`);
  console.log(`📤 From: ${gmailEmail}`);
  console.log(`📋 Subject: ${subject}`);

  try {
    // Connect to Gmail SMTP server
    console.log('🔌 Connecting to smtp.gmail.com:587...');
    const conn = await Deno.connect({
      hostname: "smtp.gmail.com",
      port: 587,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to send command and read response
    async function sendCommand(command: string): Promise<string> {
      const maskedCommand = command.includes(gmailPassword) ? command.replace(gmailPassword, '***') : command;
      console.log(`➡️ SMTP: ${maskedCommand}`);
      
      await conn.write(encoder.encode(command + "\r\n"));
      
      const buffer = new Uint8Array(1024);
      const bytesRead = await conn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, bytesRead || 0));
      console.log(`⬅️ Response: ${response.trim()}`);
      
      if (response.startsWith("5")) {
        throw new Error(`SMTP Error: ${response.trim()}`);
      }
      
      return response;
    }

    // SMTP conversation
    console.log('🤝 Starting SMTP handshake...');
    let response = await sendCommand("EHLO localhost");
    if (!response.startsWith("250")) {
      throw new Error(`EHLO failed: ${response}`);
    }

    console.log('🔐 Starting TLS...');
    response = await sendCommand("STARTTLS");
    if (!response.startsWith("220")) {
      throw new Error(`STARTTLS failed: ${response}`);
    }

    // Upgrade connection to TLS
    console.log('🔒 Upgrading to TLS connection...');
    const tlsConn = await Deno.startTls(conn, { hostname: "smtp.gmail.com" });
    
    // Helper function for TLS connection
    async function sendTlsCommand(command: string): Promise<string> {
      const maskedCommand = command.includes(gmailPassword) ? command.replace(gmailPassword, '***') : command;
      console.log(`➡️ TLS SMTP: ${maskedCommand}`);
      
      await tlsConn.write(encoder.encode(command + "\r\n"));
      
      const buffer = new Uint8Array(1024);
      const bytesRead = await tlsConn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, bytesRead || 0));
      console.log(`⬅️ TLS Response: ${response.trim()}`);
      
      if (response.startsWith("5")) {
        throw new Error(`SMTP TLS Error: ${response.trim()}`);
      }
      
      return response;
    }

    // Re-introduce ourselves after TLS
    console.log('🤝 Re-handshake after TLS...');
    response = await sendTlsCommand("EHLO localhost");
    if (!response.startsWith("250")) {
      throw new Error(`TLS EHLO failed: ${response}`);
    }

    // Authenticate
    console.log('🔑 Starting authentication...');
    response = await sendTlsCommand("AUTH LOGIN");
    if (!response.startsWith("334")) {
      throw new Error(`AUTH LOGIN failed: ${response}`);
    }

    // Send username (base64 encoded)
    const usernameB64 = btoa(gmailEmail);
    response = await sendTlsCommand(usernameB64);
    if (!response.startsWith("334")) {
      throw new Error(`Username authentication failed: ${response}`);
    }

    // Send password (base64 encoded)
    const passwordB64 = btoa(gmailPassword);
    response = await sendTlsCommand(passwordB64);
    if (!response.startsWith("235")) {
      throw new Error(`Password authentication failed: ${response}`);
    }

    console.log('✅ SMTP Authentication successful!');

    // Send email
    console.log('📮 Sending email...');
    response = await sendTlsCommand(`MAIL FROM:<${gmailEmail}>`);
    if (!response.startsWith("250")) {
      throw new Error(`MAIL FROM failed: ${response}`);
    }

    response = await sendTlsCommand(`RCPT TO:<${to}>`);
    if (!response.startsWith("250")) {
      throw new Error(`RCPT TO failed: ${response}`);
    }

    response = await sendTlsCommand("DATA");
    if (!response.startsWith("354")) {
      throw new Error(`DATA command failed: ${response}`);
    }

    // Construct email message with proper headers
    const emailMessage = [
      `From: ${gmailEmail}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36)}@gmail.com>`,
      ``,
      html.replace(/\./g, '=2E'), // Escape dots for quoted-printable
      `.`
    ].join("\r\n");

    console.log('📝 Sending email content...');
    await tlsConn.write(encoder.encode(emailMessage));
    
    const buffer = new Uint8Array(1024);
    const bytesRead = await tlsConn.read(buffer);
    response = decoder.decode(buffer.subarray(0, bytesRead || 0));
    console.log(`📧 Final response: ${response.trim()}`);
    
    if (!response.startsWith("250")) {
      throw new Error(`Email send failed: ${response}`);
    }

    // Close connection
    console.log('👋 Closing SMTP connection...');
    await sendTlsCommand("QUIT");
    tlsConn.close();

    console.log(`✅ Email sent successfully to ${to}!`);
    
    return { 
      success: true, 
      messageId: `gmail_reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
    
  } catch (error) {
    console.error(`❌ Gmail SMTP Error: ${error.message}`);
    console.error('Error stack:', error.stack);
    throw new Error(`Gmail SMTP failed: ${error.message}`);
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface TripNotification {
  trip_id: string;
  title: string;
  trip_date: string;
  departure_time: string;
  sector: string;
  travelers: string[];
  employee_emails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting trip notification check...");

    // Buscar viagens para o próximo dia
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Buscar viagens agendadas para amanhã
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        trip_date,
        departure_time,
        sector,
        travelers,
        employee_ids
      `)
      .eq('trip_date', tomorrowStr)
      .eq('status', 'scheduled');

    if (tripsError) {
      console.error('Error fetching trips:', tripsError);
      throw tripsError;
    }

    console.log(`Found ${trips?.length || 0} trips for tomorrow`);

    if (!trips || trips.length === 0) {
      return new Response(
        JSON.stringify({ message: "No trips found for tomorrow" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Processar cada viagem
    for (const trip of trips) {
      try {
        // Verificar se já foi enviada notificação para esta viagem
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('trip_id', trip.id)
          .eq('notification_type', 'trip_reminder')
          .single();

        if (existingLog) {
          console.log(`Notification already sent for trip ${trip.id}`);
          continue;
        }

        // Buscar emails dos funcionários
        let employeeEmails: string[] = [];
        if (trip.employee_ids && trip.employee_ids.length > 0) {
          const { data: employees } = await supabase
            .from('employees')
            .select('email')
            .in('id', trip.employee_ids)
            .not('email', 'is', null);

          employeeEmails = employees?.map(emp => emp.email).filter(Boolean) || [];
        }

        // Buscar emails de usuários com auth_user_id correspondente
        if (trip.employee_ids && trip.employee_ids.length > 0) {
          const { data: employeesWithAuth } = await supabase
            .from('employees')
            .select('auth_user_id')
            .in('id', trip.employee_ids)
            .not('auth_user_id', 'is', null);

          if (employeesWithAuth && employeesWithAuth.length > 0) {
            const authUserIds = employeesWithAuth.map(emp => emp.auth_user_id);
            
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id')
              .in('user_id', authUserIds);

            if (profiles && profiles.length > 0) {
              // Buscar emails dos usuários autenticados via auth.users
              // Como não podemos acessar auth.users diretamente, vamos usar os emails dos funcionários
            }
          }
        }

        // Se não há emails para enviar, pular
        if (employeeEmails.length === 0) {
          console.log(`No emails found for trip ${trip.id}`);
          continue;
        }

        // Enviar email para cada funcionário
        for (const email of employeeEmails) {
          try {
            const subject = `Lembrete: Viagem agendada para amanhã - ${trip.title}`;
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Lembrete de Viagem</h2>
                <p>Olá!</p>
                <p>Este é um lembrete de que você tem uma viagem agendada para <strong>amanhã</strong>:</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #2563eb;">${trip.title}</h3>
                  <p><strong>Data:</strong> ${new Date(trip.trip_date).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Horário de Saída:</strong> ${trip.departure_time || 'Não informado'}</p>
                  <p><strong>Setor:</strong> ${trip.sector}</p>
                  ${trip.travelers && trip.travelers.length > 0 ? 
                    `<p><strong>Participantes:</strong> ${trip.travelers.join(', ')}</p>` : ''
                  }
                </div>
                
                <p>Por favor, certifique-se de estar preparado(a) para a viagem.</p>
                <p>Em caso de dúvidas, entre em contato com a administração.</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                  Este é um email automático do Sistema de Gestão de Viagens.
                </p>
              </div>
            `;

            const emailResponse = await sendGmailNotification(email, subject, html);

            console.log(`Email sent to ${email} for trip ${trip.id}:`, emailResponse);

            // Registrar log da notificação
            await supabase
              .from('notification_logs')
              .insert({
                trip_id: trip.id,
                recipient_email: email,
                notification_type: 'trip_reminder',
                status: 'sent'
              });

          } catch (emailError) {
            console.error(`Error sending email to ${email}:`, emailError);
            
            // Registrar log do erro
            await supabase
              .from('notification_logs')
              .insert({
                trip_id: trip.id,
                recipient_email: email,
                notification_type: 'trip_reminder',
                status: 'error',
                error_message: emailError.message
              });
          }
        }

      } catch (tripError) {
        console.error(`Error processing trip ${trip.id}:`, tripError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Trip notifications processed successfully",
        processed_trips: trips.length
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Error in send-trip-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);