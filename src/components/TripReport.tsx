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
  
  // MUDANÇA: O tipo de relatório agora pode ser nulo, para controlar o efeito de impressão.
  const [reportType, setReportType] = useState<'narrative' | 'attendance' | null>(null);
  // MUDANÇA: Novo estado para armazenar o número de linhas da lista de presença.
  const [attendanceLines, setAttendanceLines] = useState(20);
  
  const [formNumber] = useState(() => String(Math.floor(Math.random() * 90000) + 10000));

  // Hook para carregar a narrativa (sem alterações)
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
  
  // MUDANÇA: Hook para disparar a impressão APÓS a atualização do estado.
  useEffect(() => {
    if (reportType) {
      window.print();
      // Reseta o tipo de relatório para não imprimir novamente em re-renderizações futuras.
      setReportType(null);
    }
  }, [reportType]);


  const handlePrintNarrative = () => {
    setReportType('narrative');
  };

  // MUDANÇA: Função agora pede o número de linhas antes de preparar para impressão.
  const handlePrintAttendance = () => {
    const linesInput = window.prompt('Quantas linhas para a lista de presença?', String(attendanceLines));
    
    // Se o usuário cancelar o prompt, não faz nada.
    if (linesInput === null) {
      return; 
    }

    const lines = parseInt(linesInput, 10);

    if (isNaN(lines) || lines <= 0) {
      alert('Por favor, insira um número válido e positivo.');
      return;
    }

    setAttendanceLines(lines);
    setReportType('attendance');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* MUDANÇA: CSS de impressão reajustado para suportar múltiplas páginas corretamente. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          
          @page {
            size: A4;
            margin: 1.5cm;
          }

          .print-page {
            width: 100% !important; max-width: none !important; min-height: 0 !important;
            margin: 0 !important; padding: 0 !important; box-shadow: none !important;
            background: white !important; color: black !important;
            font-family: Arial, sans-serif; font-size: 10pt;
          }

          /* Bloco que deve aparecer SOMENTE na primeira página */
          .report-first-page-header {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          /* Estilos do cabeçalho (semelhante ao anterior) */
          .report-header-table { display: table; width: 100%; margin-bottom: 1cm; }
          .header-row { display: table-row; }
          .header-logo-info { display: table-cell; vertical-align: middle; }
          .header-form-box-container { display: table-cell; vertical-align: middle; width: 150px; }
          .company-details h1 { font-size: 20pt; font-weight: bold; margin: 0 0 4px 0; }
          /* ... outros estilos de cabeçalho ... */

          .report-title { text-align: center; font-size: 12pt; font-weight: bold; padding-top: 8px; border-top: 2px solid black; margin-bottom: 1cm; }
          
          .trip-info-section { margin-bottom: 1cm; }
          .section-title { text-align: center; font-size: 11pt; font-weight: bold; margin-bottom: 0.5cm; }
          /* ... outros estilos de info ... */

          /* Estilos para a tabela que pode quebrar entre páginas */
          .attendance-table {
            width: 100%;
            border-collapse: collapse;
          }
          /* ESSENCIAL: Faz o cabeçalho da tabela repetir em cada página */
          .attendance-table thead {
            display: table-header-group;
          }
          .attendance-table th {
            font-weight: bold;
            font-size: 9pt;
            text-align: left;
            border-bottom: 1px solid black;
            padding: 4px 2px;
          }
          .attendance-table td {
            padding-top: 18px; /* Altura da linha */
            border-bottom: 1px solid black;
            font-size: 10pt;
            padding-left: 2px;
          }
          .col-num { width: 40px; }
          .col-name { width: 55%; }
          .col-sector { width: 45%; }

          .report-footer {
            margin-top: 1cm; padding-top: 0.5cm;
            border-top: 1px solid black;
            text-align: center; font-size: 7pt;
          }
        }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-10">
        {/* ... botões ... */}
        <button onClick={handlePrintAttendance} className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          Imprimir Lista de Presença
        </button>
        {/* ... outros botões ... */}
      </div>

      <TripNarrativeDialog open={dialogOpen} onOpenChange={setDialogOpen} tripId={trip.id} employeeId={employee?.id} initialContent={narrative} onSaved={(content) => setNarrative(content)} />

      <div className="print-content">
        <div className="print-page max-w-4xl mx-auto bg-white p-8 min-h-screen text-black">
          
          <div className="report-first-page-header">
            {/* ... Cabeçalho da empresa (semelhante ao anterior) ... */}
            <div className="report-header-table"> {/* ... */} </div>
            <h2 className="report-title">{reportType === 'narrative' ? 'RELATÓRIO DE ATENDIMENTO A CLIENTE' : 'LISTA DE PRESENÇA - VIAGEM'}</h2>
            <div className="trip-info-section">{/* ... Informações da viagem ... */}</div>
          </div>
          
          {reportType === 'narrative' && !narrativeLoading && narrative ? (
            <div className="narrative-section">{/* ... Relato ... */}</div>
          ) : reportType === 'attendance' ? (
            <div className="attendance-section">
              <h3 className="section-title">LISTA DE PRESENÇA</h3>
              {/* MUDANÇA: Usando <table> real para impressão correta em múltiplas páginas */}
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th className="col-num">Nº</th>
                    <th className="col-name">NOME COMPLETO</th>
                    <th className="col-sector">UNIDADE/SETOR</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: attendanceLines }, (_, i) => (
                    <tr key={i}>
                      <td>{String(i + 1).padStart(2, '0')}.</td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="report-footer">{/* ... Rodapé ... */}</div>
        </div>
      </div>
    </div>
  );
}