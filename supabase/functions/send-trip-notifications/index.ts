import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Simplified Gmail SMTP sending function using a robust external library
const sendGmailNotification = async (to: string, subject: string, html: string, retries = 3) => {
  const gmailEmail = Deno.env.get('GMAIL_EMAIL');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailEmail || !gmailPassword) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD secrets.');
  }

  console.log(`📧 [Reminder] Sending email to ${to}...`);
  console.log(`📤 From: ${gmailEmail}`);
  console.log(`📋 Subject: ${subject}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${retries}`);
      
      console.log('📧 Initializing SMTP client...');
      const client = new SmtpClient();

      await client.connect({
        hostname: "smtp.gmail.com",
        port: 587,
        username: gmailEmail,
        password: gmailPassword,
        tls: true,
      });

      console.log('✅ SMTP connection established');

      await client.send({
        from: gmailEmail,
        to: to,
        subject: subject,
        content: html,
        html: html,
      });

      console.log(`✅ Email sent successfully to ${to}!`);
      
      await client.close();
      
      return { 
        success: true, 
        messageId: `gmail_reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        attempt
      };
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Gmail SMTP failed after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
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
    console.log("🔔 Starting daily trip reminder check...");

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`📅 Looking for trips scheduled for: ${tomorrowStr}`);

    // Fetch trips scheduled for tomorrow
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        trip_date,
        departure_time,
        sector,
        travelers,
        employee_ids,
        description
      `)
      .eq('trip_date', tomorrowStr)
      .eq('status', 'scheduled');

    if (tripsError) {
      console.error('❌ Error fetching trips:', tripsError);
      throw tripsError;
    }

    console.log(`📊 Found ${trips?.length || 0} trips for tomorrow`);

    if (!trips || trips.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No trips found for tomorrow",
          date: tomorrowStr,
          processed: 0
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let totalProcessed = 0;
    let totalEmailsSent = 0;
    let totalErrors = 0;

    // Process each trip
    for (const trip of trips) {
      try {
        console.log(`🚗 Processing trip: ${trip.title} (ID: ${trip.id})`);

        // Check if reminder notification was already sent for this trip
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('trip_id', trip.id)
          .eq('notification_type', 'trip_reminder')
          .maybeSingle();

        if (existingLog) {
          console.log(`⏭️ Notification already sent for trip ${trip.id}`);
          continue;
        }

        // Get employee emails
        let employeeEmails: string[] = [];
        if (trip.employee_ids && trip.employee_ids.length > 0) {
          const { data: employees } = await supabase
            .from('employees')
            .select('email, name')
            .in('id', trip.employee_ids)
            .not('email', 'is', null);

          employeeEmails = employees?.filter(emp => emp.email).map(emp => emp.email) || [];
          console.log(`👥 Found ${employeeEmails.length} employees with email addresses`);
        }

        // If no emails found, skip this trip
        if (employeeEmails.length === 0) {
          console.log(`⚠️ No emails found for trip ${trip.id}`);
          continue;
        }

        // Send reminder email to each employee
        for (const email of employeeEmails) {
          try {
            const subject = `🔔 Lembrete: Viagem amanhã - ${trip.title}`;
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #f59e0b; text-align: center;">🔔 Lembrete de Viagem</h2>
                
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0; color: #92400e; font-weight: bold;">
                    ⏰ Você tem uma viagem agendada para <strong>AMANHÃ</strong>!
                  </p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <h3 style="margin-top: 0; color: #1e40af;">${trip.title}</h3>
                  ${trip.description ? `<p style="color: #64748b;"><strong>Descrição:</strong> ${trip.description}</p>` : ''}
                  
                  <div style="margin: 15px 0;">
                    <p><strong>📅 Data:</strong> ${new Date(trip.trip_date).toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    ${trip.departure_time ? `<p><strong>🕐 Horário de Saída:</strong> ${trip.departure_time}</p>` : ''}
                    <p><strong>🏢 Setor:</strong> ${trip.sector}</p>
                    ${trip.travelers && trip.travelers.length > 0 ? 
                      `<p><strong>👥 Participantes:</strong> ${trip.travelers.join(', ')}</p>` : ''
                    }
                  </div>
                </div>

                <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Olá!</strong></p>
                  <p style="margin: 10px 0 0 0;">Este é um lembrete automático de que você tem uma viagem agendada para amanhã. Por favor, certifique-se de estar preparado(a).</p>
                </div>
                
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                  <p style="margin: 0; color: #b91c1c;">
                    <strong>📋 Lembrete:</strong>
                  </p>
                  <ul style="margin: 5px 0 0 0; color: #b91c1c;">
                    <li>Confirme o local e horário de encontro</li>
                    <li>Prepare a documentação necessária</li>
                    <li>Entre em contato em caso de impedimento</li>
                  </ul>
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; text-align: center;">
                  Este é um lembrete automático do Sistema de Gestão de Viagens.
                  <br>Enviado em: ${new Date().toLocaleString('pt-BR')}
                  <br>ID da Viagem: ${trip.id}
                </p>
              </div>
            `;

            const emailResponse = await sendGmailNotification(email, subject, html);
            
            console.log(`✅ Reminder email sent to ${email} for trip ${trip.id}`);
            totalEmailsSent++;

            // Log the successful notification
            await supabase
              .from('notification_logs')
              .insert({
                trip_id: trip.id,
                recipient_email: email,
                notification_type: 'trip_reminder',
                status: 'sent'
              });

          } catch (emailError) {
            console.error(`❌ Error sending reminder email to ${email}:`, emailError);
            totalErrors++;
            
            // Log the error
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

        totalProcessed++;

      } catch (tripError) {
        console.error(`❌ Error processing trip ${trip.id}:`, tripError);
        totalErrors++;
      }
    }

    const summary = {
      date: tomorrowStr,
      trips_found: trips.length,
      trips_processed: totalProcessed,
      emails_sent: totalEmailsSent,
      errors: totalErrors,
      timestamp: new Date().toISOString()
    };

    console.log("📊 Trip reminder processing complete:", summary);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Trip reminder notifications processed successfully",
        summary
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("❌ Error in send-trip-notifications function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        function: 'send-trip-notifications'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);