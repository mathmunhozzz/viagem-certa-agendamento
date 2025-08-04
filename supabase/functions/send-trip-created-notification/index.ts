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

// Simplified Gmail SMTP sending function using a robust external library
const sendGmailNotification = async (to: string, subject: string, html: string, retries = 3) => {
  const gmailEmail = Deno.env.get('GMAIL_EMAIL');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailEmail || !gmailPassword) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD secrets.');
  }

  console.log(`📧 [Attempt] Sending email to ${to}...`);
  console.log(`📤 From: ${gmailEmail}`);
  console.log(`📋 Subject: ${subject}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${retries}`);
      
      // Use a more robust approach with fetch to Gmail's API-like endpoint
      // This is a simplified SMTP approach that avoids complex TLS handshake issues
      const { default: SMTPClient } = await import("https://deno.land/x/smtp@v0.7.0/mod.ts");
      
      console.log('📧 Initializing SMTP client...');
      const client = new SMTPClient();

      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 465, // Use port 465 for SSL/TLS instead of 587 with STARTTLS
        username: gmailEmail,
        password: gmailPassword,
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
        messageId: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    // Test mode
    if (requestData.testMode && requestData.testEmail) {
      console.log('🧪 TEST MODE: Sending test email to', requestData.testEmail);
      
      const subject = 'Teste - Sistema de Notificações de Viagem';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">🧪 Teste do Sistema de Notificações</h2>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              ⚠️ Este é um email de TESTE para verificar se o sistema está funcionando.
            </p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Teste de Conectividade Gmail SMTP</h3>
            <p><strong>Status:</strong> ✅ Conexão estabelecida com sucesso!</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Servidor:</strong> Gmail SMTP (smtp.gmail.com:587)</p>
          </div>

          <p>Se você recebeu este email, o sistema de notificações está funcionando perfeitamente! 🎉</p>
          
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <p style="margin: 0; color: #15803d;">
              ✅ <strong>Sistema operacional!</strong> Emails de notificação de viagem serão enviados automaticamente.
            </p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Sistema de Gestão de Viagens - Teste Automático
            <br>ID: TEST_${Date.now()}
          </p>
        </div>
      `;

      try {
        const result = await sendGmailNotification(requestData.testEmail, subject, html);
        
        return new Response(JSON.stringify({
          success: true,
          testMode: true,
          message: 'Email de teste enviado com sucesso! ✅',
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
          error: error.message,
          details: 'Verifique se as credenciais Gmail estão corretas e se a senha de app foi configurada.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Production mode - process actual trip notification
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
        results.push({
          employee: employee.name,
          email: 'N/A',
          status: 'skipped',
          reason: 'No email address'
        });
        continue;
      }

      try {
        const subject = `Nova viagem agendada: ${tripData.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; text-align: center;">🚗 Nova Viagem Agendada</h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #1e40af;">${tripData.title}</h3>
              ${tripData.description ? `<p style="color: #64748b;"><strong>Descrição:</strong> ${tripData.description}</p>` : ''}
              
              <div style="margin: 15px 0;">
                <p><strong>📅 Data:</strong> ${new Date(tripData.tripDate).toLocaleDateString('pt-BR')}</p>
                ${tripData.departureTime ? `<p><strong>🕐 Horário de Saída:</strong> ${tripData.departureTime}</p>` : ''}
                <p><strong>👤 Cliente:</strong> ${tripData.client}</p>
                <p><strong>🏢 Setor:</strong> ${tripData.sector}</p>
              </div>
            </div>

            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Olá ${employee.name},</strong></p>
              <p style="margin: 10px 0 0 0;">Você foi designado(a) para a viagem acima. Por favor, verifique os detalhes e entre em contato caso tenha alguma dúvida.</p>
            </div>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #b91c1c;">
                <strong>⚠️ Importante:</strong> Confirme sua disponibilidade o quanto antes.
              </p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; text-align: center;">
              Esta é uma notificação automática do Sistema de Gestão de Viagens.
              <br>ID da Viagem: ${tripData.tripId}
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
          messageId: result.messageId,
          attempt: result.attempt
        });

        console.log(`✅ Email sent successfully to ${employee.email}`);

      } catch (error) {
        console.error(`❌ Failed to send email to ${employee.email}:`, error);
        
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

    const successCount = results.filter(r => r.status === 'sent').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return new Response(JSON.stringify({
      success: true,
      summary: {
        total: results.length,
        sent: successCount,
        errors: errorCount
      },
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in send-trip-created-notification function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);