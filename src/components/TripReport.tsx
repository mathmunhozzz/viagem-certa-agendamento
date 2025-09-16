import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { TripNarrativeDialog } from '@/components/TripNarrativeDialog';

interface TripReportProps {
  trip: {
    id: string;
    title: string;
    description: string;
    trip_date: string;
    departure_time: string;
    sector: string;
    travelers: string[];
    status: string;
    employees?: Array<{
      id: string;
      name: string;
    }>;
    vehicle?: {
      brand: string;
      model: string;
      plate: string;
    };
    clients?: {
      id: string;
      name: string;
      municipality: string;
    };
    credit_card?: {
      id: string;
      name: string;
      brand: string;
      last_four_digits: string;
    };
  };
  onClose: () => void;
}

export function TripReport({ trip, onClose }: TripReportProps) {
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showNarrativeDialog, setShowNarrativeDialog] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { role } = useUserRole();
  const { employee: currentEmployee } = useCurrentEmployee();

  const isAdminOrManager = role === 'admin' || role === 'manager';
  const selectedEmployeeId = isAdminOrManager && trip.employees?.[0]?.id 
    ? trip.employees[0].id 
    : currentEmployee?.id || '';
  const selectedEmployeeName = isAdminOrManager && trip.employees?.[0]?.name 
    ? trip.employees[0].name 
    : currentEmployee?.name || '';

  useEffect(() => {
    const loadNarrative = async () => {
      if (!selectedEmployeeId || !trip.id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('trip_reports')
        .select('content')
        .eq('employee_id', selectedEmployeeId)
        .eq('trip_id', trip.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar relato:', error);
      } else if (data) {
        setNarrative(data.content || '');
      }
      setLoading(false);
    };

    loadNarrative();
  }, [selectedEmployeeId, trip.id]);

  const handlePrintReport = () => {
    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 1000);
  };

  const handleNarrativeSaved = (content: string) => {
    setNarrative(content);
    setShowNarrativeDialog(false);
    toast({
      title: "Sucesso",
      description: "Relato salvo com sucesso!",
    });
  };

  return (
    <>
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          body.print-mode * {
            visibility: hidden !important;
          }
          
          body.print-mode .report-print-content,
          body.print-mode .report-print-content * {
            visibility: visible !important;
          }
          
          body.print-mode .report-print-content {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 auto !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 20mm;
          }

          .simple-report {
            width: 100% !important;
            font-family: 'Arial', sans-serif !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
            color: #000 !important;
            background: white !important;
          }

          .header {
            text-align: center !important;
            margin-bottom: 30px !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 15px !important;
          }

          .company-title {
            font-size: 20pt !important;
            font-weight: bold !important;
            margin-bottom: 8px !important;
          }

          .report-subtitle {
            font-size: 16pt !important;
            font-weight: bold !important;
          }

          .employee-name {
            text-align: center !important;
            font-size: 14pt !important;
            font-weight: bold !important;
            margin: 25px 0 !important;
            padding: 12px !important;
            border: 2px solid #000 !important;
          }

          .trip-details {
            margin: 25px 0 !important;
          }

          .detail-line {
            margin-bottom: 10px !important;
            padding-bottom: 5px !important;
            border-bottom: 1px dotted #333 !important;
            display: flex !important;
            justify-content: space-between !important;
          }

          .detail-label {
            font-weight: bold !important;
            min-width: 120px !important;
          }

          .narrative-section {
            margin: 30px 0 !important;
          }

          .narrative-title {
            font-weight: bold !important;
            text-align: center !important;
            margin-bottom: 15px !important;
            font-size: 14pt !important;
            text-decoration: underline !important;
          }

          .narrative-box {
            padding: 15px !important;
            border: 2px solid #000 !important;
            min-height: 120px !important;
            text-align: justify !important;
            background: white !important;
          }

          .signatures-title {
            font-weight: bold !important;
            text-align: center !important;
            margin: 35px 0 20px 0 !important;
            font-size: 14pt !important;
            text-decoration: underline !important;
          }

          .signature-line {
            margin-bottom: 20px !important;
            padding-bottom: 3px !important;
            border-bottom: 1px solid #000 !important;
            display: flex !important;
            align-items: center !important;
          }

          .line-number {
            font-weight: bold !important;
            margin-right: 20px !important;
            min-width: 30px !important;
          }
        }
        
        @media screen {
          .report-print-content {
            display: none;
          }
        }
      `}</style>

      {/* Screen View */}
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Relatório de Viagem</h1>
              <p className="text-blue-100">Sistema Simples de Relatórios</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowNarrativeDialog(true)} className="bg-green-500 hover:bg-green-600">
                Editar Relato
              </Button>
              <Button onClick={handlePrintReport} className="bg-orange-500 hover:bg-orange-600">
                Imprimir
              </Button>
              <Button onClick={onClose} className="bg-red-500 hover:bg-red-600">
                Fechar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div className="max-w-4xl mx-auto bg-white shadow-lg p-8">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-3xl font-bold mb-2">OPPORTUNITY SISTEMAS</h1>
              <h2 className="text-xl font-bold">RELATÓRIO DE VIAGEM</h2>
            </div>

            <div className="text-center font-bold text-lg border-2 border-black p-3 mb-6">
              Funcionário: {selectedEmployeeName}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span className="font-bold">Data:</span>
                <span>{new Date(trip.trip_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span className="font-bold">Horário:</span>
                <span>{trip.departure_time}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span className="font-bold">Setor:</span>
                <span>{trip.sector}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span className="font-bold">Cliente:</span>
                <span>{trip.clients?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span className="font-bold">Município:</span>
                <span>{trip.clients?.municipality || 'N/A'}</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-center mb-3 underline">RELATO DETALHADO</h3>
              <div className="border-2 border-black p-4 min-h-[120px] bg-gray-50">
                {narrative || 'Nenhum relato foi registrado para esta viagem.'}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-center mb-4 underline">LISTA DE ASSINATURAS</h3>
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i + 1} className="flex items-center mb-4 border-b border-black pb-1">
                  <span className="font-bold mr-4 min-w-8">{String(i + 1).padStart(2, '0')}.</span>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Content - Single Simple Page */}
      <div className="report-print-content">
        <div className="simple-report">
          <div className="header">
            <div className="company-title">OPPORTUNITY SISTEMAS</div>
            <div className="report-subtitle">RELATÓRIO DE VIAGEM</div>
          </div>

          <div className="employee-name">
            Funcionário: {selectedEmployeeName}
          </div>

          <div className="trip-details">
            <div className="detail-line">
              <span className="detail-label">Data:</span>
              <span>{new Date(trip.trip_date).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="detail-line">
              <span className="detail-label">Horário:</span>
              <span>{trip.departure_time}</span>
            </div>
            <div className="detail-line">
              <span className="detail-label">Setor:</span>
              <span>{trip.sector}</span>
            </div>
            <div className="detail-line">
              <span className="detail-label">Cliente:</span>
              <span>{trip.clients?.name || 'N/A'}</span>
            </div>
            <div className="detail-line">
              <span className="detail-label">Município:</span>
              <span>{trip.clients?.municipality || 'N/A'}</span>
            </div>
          </div>

          <div className="narrative-section">
            <div className="narrative-title">RELATO DETALHADO</div>
            <div className="narrative-box">
              {narrative || 'Nenhum relato foi registrado para esta viagem.'}
            </div>
          </div>

          <div className="signatures-title">LISTA DE ASSINATURAS</div>
          
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i + 1} className="signature-line">
              <span className="line-number">{String(i + 1).padStart(2, '0')}.</span>
              <span style={{ flex: 1 }}></span>
            </div>
          ))}
        </div>
      </div>

      <TripNarrativeDialog
        open={showNarrativeDialog}
        onOpenChange={setShowNarrativeDialog}
        tripId={trip.id}
        employeeId={selectedEmployeeId}
        initialContent={narrative}
        onSaved={handleNarrativeSaved}
      />
    </>
  );
}
