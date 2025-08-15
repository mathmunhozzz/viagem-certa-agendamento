import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useCurrentUserDisplayName } from '@/hooks/useCurrentUserDisplayName';
import { supabase } from '@/integrations/supabase/client';
import { TripNarrativeDialog } from './TripNarrativeDialog';

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
  };
  onClose: () => void;
}

export function TripReport({ trip, onClose }: TripReportProps) {
  const { employee } = useCurrentEmployee();
  const { displayName } = useCurrentUserDisplayName();

  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [reportType, setReportType] = useState<'narrative' | 'attendance'>('narrative');
  const [formNumber] = useState(() => String(Math.floor(Math.random() * 90000) + 10000));

  useEffect(() => {
    const loadNarrative = async () => {
      if (!employee?.id) {
        setNarrative(null);
        setNarrativeLoading(false);
        return;
      }
      setNarrativeLoading(true);
      const { data, error } = await supabase
        .from('trip_reports')
        .select('content')
        .eq('trip_id', trip.id)
        .eq('employee_id', employee.id);

      if (error) {
        console.error('Erro ao carregar relato da viagem:', error);
        setNarrative(null);
      } else {
        const rows = (data as Array<{ content: string }> | null) ?? null;
        setNarrative(rows?.[0]?.content ?? null);
      }
      setNarrativeLoading(false);
    };

    loadNarrative();
  }, [employee?.id, trip.id]);

  const handlePrintNarrative = () => {
    setReportType('narrative');
    setTimeout(() => window.print(), 100);
  };

  const handlePrintAttendance = () => {
    setReportType('attendance');
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* Estilos de impressão com controle de quebra de página */}
      <style>{`
        @media print {
          /* Esconde tudo, exceto o conteúdo de impressão */
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          
          /* Configurações da página */
          @page {
            margin: 1.5cm; /* Margens da página */
          }

          /* Estilos para o container da página de impressão */
          .print-page {
            width: auto !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif;
            font-size: 12pt;
          }

          /* Novo container para o cabeçalho da primeira página */
          .report-first-page-header {
            page-break-after: avoid; /* Tenta evitar uma quebra de página logo após este bloco */
            page-break-inside: avoid; /* Tenta evitar que este bloco seja dividido em duas páginas */
          }

          /* Estilos do cabeçalho */
          .report-header {
            margin-bottom: 2rem;
          }
          .header-flex {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
          }
          .header-flex h1 {
            font-size: 24pt;
            font-weight: bold;
            margin: 0 0 0.5rem 0;
            letter-spacing: 0.05em;
          }
          .header-flex p {
             font-size: 9pt;
             margin: 0;
          }
          .form-number-box {
            border: 2px solid black;
            padding: 0.75rem;
            text-align: center;
            min-width: 150px;
          }
          
          /* Títulos e informações gerais */
          .section-title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .info-line {
            display: flex;
            align-items: flex-end; /* Alinha o texto na base da linha */
            margin-bottom: 1rem;
          }
          .info-label {
            font-weight: bold;
            width: 120px; /* Largura fixa para os rótulos */
            font-size: 11pt;
            padding-right: 10px;
          }
          .info-content {
            flex: 1;
            border-bottom: 1px solid #333;
            min-height: 24px;
            padding-bottom: 2px;
            font-size: 11pt;
          }

          /* Conteúdo principal que pode fluir para múltiplas páginas */
          .report-content {
            page-break-before: auto; /* Permite que o conteúdo comece em uma nova página se necessário */
            margin-top: 3rem;
          }

          .narrative-box {
            border: 1px solid black;
            padding: 1rem;
            min-height: 400px;
            white-space: pre-wrap;
            font-size: 11pt;
            line-height: 1.5;
          }
          .attendance-grid {
            display: grid;
            grid-template-columns: 2.5rem 1fr 1fr; /* Colunas para número, nome e setor */
            gap: 1rem 2rem;
            align-items: center;
          }
          .attendance-header {
             font-weight: bold;
             text-align: left;
             border-bottom: 1px solid black;
             padding-bottom: 0.5rem;
          }
          .attendance-line {
            border-bottom: 1px solid black;
            height: 28px;
          }
          
          /* Estilos do rodapé */
          .report-footer {
            margin-top: 4rem;
            padding-top: 1rem;
            border-top: 1px solid black;
            text-align: center;
            font-size: 8pt;
          }
        }
      `}</style>

      {/* Control buttons - hidden in print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setDialogOpen(true)}
          className="bg-travel-secondary text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
          title={!employee?.id ? 'Vincule seu usuário a um funcionário para relatar a viagem' : 'Escrever/editar relato da viagem'}
          disabled={!employee?.id}
        >
          Relatar viagem
        </button>
        {!narrativeLoading && narrative && (
          <button
            onClick={handlePrintNarrative}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Imprimir Relato
          </button>
        )}
        <button
          onClick={handlePrintAttendance}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Imprimir Lista de Presença
        </button>
        <button
          onClick={onClose}
          className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 transition-colors"
        >
          Fechar
        </button>
      </div>

      <TripNarrativeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tripId={trip.id}
        employeeId={employee?.id}
        initialContent={narrative}
        onSaved={(content) => setNarrative(content)}
      />

      <div className="print-content">
        <div className="print-page max-w-4xl mx-auto bg-white p-8 min-h-screen text-black">
          
          {/* Agrupando tudo que é SÓ da primeira página */}
          <div className="report-first-page-header">
            {/* Header */}
            <div className="report-header">
              <div className="header-flex">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img src="/lovable-uploads/a031923e-3408-476a-8ad3-0b0de5cc4585.png" alt="Opportunity Sistemas Logo" className="w-full h-full object-contain"/>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">OPPORTUNITY SISTEMAS</h1>
                    <div className="text-sm space-y-1">
                      <p>Rua dos Comerciários, 1234 - Centro - Cascavel/PR - CEP: 85801-050</p>
                      <p>Tel: (45) 3220-7070 - contato@opportunity.com.br</p>
                      <p>CNPJ: 12.345.678/0001-90</p>
                    </div>
                  </div>
                </div>
                
                <div className="form-number-box">
                  <div className="text-xs font-bold mb-1">FORMULÁRIO Nº</div>
                  <div className="text-xl font-bold mb-2">{formNumber}</div>
                  <div className="text-xs">
                    DATA: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>
              
              <div className="border-t-2 border-black pt-4">
                <h2 className="section-title text-lg">
                  {reportType === 'narrative' ? 'RELATÓRIO DE ATENDIMENTO A CLIENTE' : 'LISTA DE PRESENÇA - VIAGEM'}
                </h2>
              </div>
            </div>

            {/* Trip information section */}
            <div className="mb-8">
              <h3 className="section-title text-lg">INFORMAÇÕES DA VIAGEM</h3>
              <div className="space-y-4">
                <div className="info-line">
                  <span className="info-label">CLIENTE:</span>
                  <div className="info-content">{trip.clients?.name || trip.sector}</div>
                </div>
                <div className="info-line">
                  <span className="info-label">CIDADE:</span>
                  <div className="info-content">{trip.clients?.municipality || 'Não informado'}</div>
                </div>
                <div className="info-line">
                  <span className="info-label">DESCRIÇÃO:</span>
                  <div className="info-content">{trip.description || trip.title}</div>
                </div>
                <div className="info-line">
                  <span className="info-label">FUNCIONÁRIO:</span>
                  <div className="info-content">{displayName}</div>
                </div>
                <div className="info-line">
                  <span className="info-label">DATA:</span>
                  <div className="info-content">{format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo que pode se estender por várias páginas */}
          <div className="report-content">
            {reportType === 'narrative' && !narrativeLoading && narrative ? (
              <div>
                <h3 className="section-title">RELATO DA VIAGEM</h3>
                <div className="narrative-box">{narrative}</div>
              </div>
            ) : reportType === 'attendance' ? (
              <div>
                <h3 className="section-title">LISTA DE PRESENÇA</h3>
                <div className="attendance-grid">
                  {/* Headers */}
                  <div></div>
                  <div className="attendance-header">NOME COMPLETO</div>
                  <div className="attendance-header">UNIDADE/SETOR</div>

                  {/* Lines */}
                  {Array.from({ length: 15 }, (_, i) => (
                    <>
                      <div key={`num-${i}`} className="font-medium">{String(i + 1).padStart(2, '0')}.</div>
                      <div key={`line1-${i}`} className="attendance-line"></div>
                      <div key={`line2-${i}`} className="attendance-line"></div>
                    </>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="report-footer">
            <p>OPPORTUNITY SISTEMAS - Sistema de Gestão Empresarial</p>
            <p>Página 1 de 1 - Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}