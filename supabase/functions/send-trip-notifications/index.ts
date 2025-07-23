import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
            const emailResponse = await resend.emails.send({
              from: "Sistema de Viagens <onboarding@resend.dev>",
              to: [email],
              subject: `Lembrete: Viagem agendada para amanhã - ${trip.title}`,
              html: `
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
              `,
            });

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