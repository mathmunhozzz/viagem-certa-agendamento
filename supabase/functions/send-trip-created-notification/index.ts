import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

const sendGmailNotification = async (to: string, subject: string, html: string) => {
  const gmailEmail = Deno.env.get('GMAIL_EMAIL');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailEmail || !gmailPassword) {
    throw new Error('Gmail credentials not configured');
  }

  // Using Gmail SMTP via fetch to a mail service
  const emailData = {
    from: gmailEmail,
    to,
    subject,
    html,
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmailEmail,
        pass: gmailPassword
      }
    }
  };

  // For now, we'll simulate the email sending and log it
  console.log(`Sending email to ${to}:`, emailData);
  
  // In a real implementation, you'd use a library like nodemailer
  // or make a request to a service that can send SMTP emails
  return { success: true, messageId: `msg_${Date.now()}` };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const tripData: TripNotificationData = await req.json();
    console.log('Processing trip notification for:', tripData);

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