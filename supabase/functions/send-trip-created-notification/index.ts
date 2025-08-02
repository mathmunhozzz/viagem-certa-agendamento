import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface TripNotificationData {
  tripId: string;
  title: string;
  description?: string;
  tripDate: string;
  departureTime?: string;
  client: string;
  sector: string;
  employeeIds: string[];
}

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
      messageId: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
    
  } catch (error) {
    console.error(`❌ Gmail SMTP Error: ${error.message}`);
    console.error('Error stack:', error.stack);
    throw new Error(`Gmail SMTP failed: ${error.message}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    console.log('Processing trip notification for:', requestData);

    // Verificar se é modo de teste
    if (requestData.testMode && requestData.testEmail) {
      console.log('🧪 TEST MODE: Sending test email to', requestData.testEmail);
      
      const subject = 'Teste - Nova viagem agendada: Viagem de Teste Gmail SMTP';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🧪 TESTE - Nova Viagem Agendada</h2>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              ⚠️ Este é um email de TESTE para verificar se o sistema de notificações está funcionando.
            </p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Viagem de Teste - Gmail SMTP</h3>
            <p><strong>Descrição:</strong> Esta é uma viagem de teste para verificar se o sistema de notificações por email está funcionando corretamente.</p>
            
            <div style="margin: 15px 0;">
              <p><strong>📅 Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
              <p><strong>🕐 Horário:</strong> 09:00</p>
              <p><strong>👤 Cliente:</strong> Cliente de Teste</p>
              <p><strong>🏢 Setor:</strong> Setor de Teste</p>
            </div>
          </div>

          <p>Olá,</p>
          <p>Se você recebeu este email, significa que o sistema de notificações por Gmail SMTP está funcionando corretamente! ✅</p>
          
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <p style="margin: 0; color: #15803d;">
              ✅ <strong>Teste bem-sucedido!</strong> O sistema pode enviar emails via Gmail SMTP.
            </p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            Este é um email de teste automático do sistema de gestão de viagens.
            <br>Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `;

      try {
        // Se skipActualSend for true, apenas simular o envio
        if (requestData.skipActualSend) {
          console.log('🔧 SIMULATION MODE: Skipping actual email send');
          const result = { 
            success: true, 
            messageId: 'simulated_test_' + Date.now(),
            simulation: true 
          };
          
          return new Response(JSON.stringify({
            success: true,
            testMode: true,
            simulation: true,
            message: 'Teste de conectividade bem-sucedido (simulação)!',
            result
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const result = await sendGmailNotification(requestData.testEmail, subject, html);
        
        return new Response(JSON.stringify({
          success: true,
          testMode: true,
          message: 'Email de teste enviado com sucesso!',
          result
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('Erro no envio de teste:', error);
        return new Response(JSON.stringify({
          success: false,
          testMode: true,
          error: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    const tripData: TripNotificationData = requestData;
    console.log('Processing actual trip notification for:', tripData);

    // Get employee emails
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, email')
      .in('id', tripData.employeeIds);

    if (employeesError) {
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    if (!employees || employees.length === 0) {
      throw new Error('No employees found');
    }

    const results = [];

    for (const employee of employees) {
      if (!employee.email) {
        console.warn(`Employee ${employee.name} has no email address`);
        continue;
      }

      try {
        const subject = `Nova viagem agendada: ${tripData.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nova Viagem Agendada</h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">${tripData.title}</h3>
              ${tripData.description ? `<p><strong>Descrição:</strong> ${tripData.description}</p>` : ''}
              
              <div style="margin: 15px 0;">
                <p><strong>📅 Data:</strong> ${new Date(tripData.tripDate).toLocaleDateString('pt-BR')}</p>
                ${tripData.departureTime ? `<p><strong>🕐 Horário:</strong> ${tripData.departureTime}</p>` : ''}
                <p><strong>👤 Cliente:</strong> ${tripData.client}</p>
                <p><strong>🏢 Setor:</strong> ${tripData.sector}</p>
              </div>
            </div>

            <p>Olá ${employee.name},</p>
            <p>Você foi designado(a) para a viagem acima. Por favor, verifique os detalhes e entre em contato caso tenha alguma dúvida.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Esta é uma notificação automática do sistema de gestão de viagens.
            </p>
          </div>
        `;

        const result = await sendGmailNotification(employee.email, subject, html);
        
        // Log the notification
        await supabase
          .from('notification_logs')
          .insert({
            trip_id: tripData.tripId,
            recipient_email: employee.email,
            notification_type: 'trip_created',
            status: 'sent'
          });

        results.push({
          employee: employee.name,
          email: employee.email,
          status: 'sent',
          messageId: result.messageId
        });

        console.log(`Email sent successfully to ${employee.email}`);

      } catch (error) {
        console.error(`Failed to send email to ${employee.email}:`, error);
        
        // Log the error
        await supabase
          .from('notification_logs')
          .insert({
            trip_id: tripData.tripId,
            recipient_email: employee.email,
            notification_type: 'trip_created',
            status: 'error',
            error_message: error.message
          });

        results.push({
          employee: employee.name,
          email: employee.email,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in send-trip-created-notification function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);