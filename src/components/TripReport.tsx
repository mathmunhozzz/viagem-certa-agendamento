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
      {/* MUDANÇA: CSS de impressão totalmente refeito para ser robusto e compacto. */}
      <style>{`
        @media print {
          body, html {
            height: 100%;
            overflow: hidden;
          }
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
          
          @page {
            size: A4;
            margin: 1.5cm;
          }

          .print-page {
            width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif;
            font-size: 10pt; /* Tamanho de fonte base menor para caber mais */
          }

          /* Layout do Cabeçalho Principal */
          .report-header {
            display: table;
            width: 100%;
            border-spacing: 0;
            margin-bottom: 1cm;
          }
          .header-row {
            display: table-row;
          }
          .header-logo-info {
            display: table-cell;
            vertical-align: middle;
          }
          .header-form-box-container {
            display: table-cell;
            vertical-align: middle;
            width: 150px; /* Largura fixa para a caixa do formulário */
          }
          .logo-img {
             width: 64px; /* 16 * 4 */
             height: 64px;
             object-fit: contain;
             vertical-align: middle;
             margin-right: 12px;
          }
          .company-details {
             display: inline-block;
             vertical-align: middle;
          }
          .company-details h1 {
            font-size: 20pt;
            font-weight: bold;
            margin: 0 0 4px 0;
          }
          .company-details p {
            font-size: 8pt;
            margin: 0;
            line-height: 1.2;
          }
          .form-number-box {
            border: 2px solid black;
            padding: 8px;
            text-align: center;
          }
          .form-number-box p {
            margin: 0;
            font-size: 8pt;
          }
          .form-number-box .form-number {
             font-size: 16pt;
             font-weight: bold;
             margin: 2px 0;
          }

          .report-title {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            padding-top: 8px;
            border-top: 2px solid black;
            margin-bottom: 1cm;
          }
          
          /* Layout das Informações da Viagem */
          .trip-info-section, .attendance-section {
            margin-bottom: 1cm;
          }
          .section-title {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 0.5cm;
          }
          .info-line {
            display: flex;
            margin-bottom: 8px; /* Espaçamento menor */
          }
          .info-label {
            font-weight: bold;
            width: 100px;
            font-size: 10pt;
            flex-shrink: 0;
          }
          .info-content {
            flex-grow: 1;
            border-bottom: 1px solid #333;
            padding-bottom: 1px;
            font-size: 10pt;
            line-height: 1;
          }

          /* Layout da Lista de Presença (usando tabela CSS) */
          .attendance-table {
            display: table;
            width: 100%;
            border-collapse: collapse;
          }
          .attendance-header, .attendance-row {
            display: table-row;
          }
          .attendance-header div {
            display: table-cell;
            font-weight: bold;
            font-size: 9pt;
            border-bottom: 1px solid black;
            padding: 4px 0;
          }
          .attendance-row div {
            display: table-cell;
            padding-top: 16px; /* Aumenta a altura da linha */
            border-bottom: 1px solid black;
            font-size: 10pt;
          }
          .cell-num { width: 30px; }
          .cell-name { width: 55%; }
          .cell-sector { width: 45%; }
          
          .report-footer {
            margin-top: 1cm;
            padding-top: 0.5cm;
            border-top: 1px solid black;
            text-align: center;
            font-size: 7pt;
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

      {/* MUDANÇA: Estrutura HTML simplificada para combinar com o novo CSS */}
      <div className="print-content">
        <div className="print-page max-w-4xl mx-auto bg-white p-8 min-h-screen text-black">
          
          <div className="report-header">
            <div className="header-row">
              <div className="header-logo-info">
                <img src="/lovable-uploads/a031923e-3408-476a-8ad3-0b0de5cc4585.png" alt="Opportunity Sistemas Logo" className="logo-img"/>
                <div className="company-details">
                  <h1>OPPORTUNITY SISTEMAS</h1>
                  <p>Rua dos Comerciários, 1234 - Centro - Cascavel/PR - CEP: 85801-050</p>
                  <p>Tel: (45) 3220-7070 - contato@opportunity.com.br</p>
                  <p>CNPJ: 12.345.678/0001-90</p>
                </div>
              </div>
              <div className="header-form-box-container">
                <div className="form-number-box">
                  <p>FORMULÁRIO Nº</p>
                  <p className="form-number">{formNumber}</p>
                  <p>DATA: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="report-title">
            {reportType === 'narrative' ? 'RELATÓRIO DE ATENDIMENTO A CLIENTE' : 'LISTA DE PRESENÇA - VIAGEM'}
          </h2>

          <div className="trip-info-section">
            <h3 className="section-title">INFORMAÇÕES DA VIAGEM</h3>
            <div className="info-line">
              <span className="info-label">CLIENTE:</span>
              <span className="info-content">{trip.clients?.name || trip.sector}</span>
            </div>
            <div className="info-line">
              <span className="info-label">CIDADE:</span>
              <span className="info-content">{trip.clients?.municipality || 'Não informado'}</span>
            </div>
            <div className="info-line">
              <span className="info-label">DESCRIÇÃO:</span>
              <span className="info-content">{trip.description || trip.title}</span>
            </div>
            <div className="info-line">
              <span className="info-label">FUNCIONÁRIO:</span>
              <span className="info-content">{displayName}</span>
            </div>
            <div className="info-line">
              <span className="info-label">DATA:</span>
              <span className="info-content">{format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          </div>
          
          {reportType === 'narrative' && !narrativeLoading && narrative ? (
            <div className="narrative-section">
                <h3 className="section-title">RELATO DA VIAGEM</h3>
                <div className="border-2 border-black p-4 min-h-[320px] whitespace-pre-wrap text-sm leading-relaxed">{narrative}</div>
            </div>
          ) : reportType === 'attendance' ? (
            <div className="attendance-section">
              <h3 className="section-title">LISTA DE PRESENÇA</h3>
              <div className="attendance-table">
                <div className="attendance-header">
                  <div className="cell-num">Nº</div>
                  <div className="cell-name">NOME COMPLETO</div>
                  <div className="cell-sector">UNIDADE/SETOR</div>
                </div>
                {/* MUDANÇA: Loop agora gera 20 linhas */}
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="attendance-row">
                    <div className="cell-num">{String(i + 1).padStart(2, '0')}.</div>
                    <div className="cell-name"></div>
                    <div className="cell-sector"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="report-footer">
            <p>OPPORTUNITY SISTEMAS - Sistema de Gestão Empresarial</p>
            <p>Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}