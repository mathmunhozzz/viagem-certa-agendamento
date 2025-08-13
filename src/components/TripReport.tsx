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
  const { employee, loading: employeeLoading } = useCurrentEmployee();
  const { displayName } = useCurrentUserDisplayName();

  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  // Carregar relato do funcionário atual (se houver)
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
        setNarrative(data?.[0]?.content ?? null);
      }
      setNarrativeLoading(false);
    };

    loadNarrative();
  }, [employee?.id, trip.id]);

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* Print styles */}
      <style>{`
        @media print {
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
          .print-page {
            margin: 0;
            padding: 40px;
            box-shadow: none;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif;
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
        <button
          onClick={handlePrint}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Imprimir
        </button>
        <button
          onClick={onClose}
          className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 transition-colors"
        >
          Fechar
        </button>
      </div>

      {/* Relatar Viagem Dialog */}
      <TripNarrativeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tripId={trip.id}
        employeeId={employee?.id}
        initialContent={narrative}
        onSaved={(content) => setNarrative(content)}
      />

      {/* Report content */}
      <div className="print-content">
        <div className="print-page max-w-4xl mx-auto bg-white p-8 min-h-screen text-black">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 flex-shrink-0">
                  <img 
                    src="/lovable-uploads/a031923e-3408-476a-8ad3-0b0de5cc4585.png" 
                    alt="Opportunity Sistemas Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-black mb-2 tracking-wide">OPPORTUNITY SISTEMAS</h1>
                  <div className="text-sm text-black space-y-1">
                    <p>Rua dos Comerciários, 1234 - Centro - Cascavel/PR - CEP: 85801-050</p>
                    <p>Tel: (45) 3220-7070 - contato@opportunity.com.br</p>
                    <p>CNPJ: 12.345.678/0001-90</p>
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-black p-4 text-center min-w-[180px]">
                <div className="text-xs font-bold mb-1">FORMULÁRIO Nº</div>
                <div className="text-xl font-bold mb-2">{String(Math.floor(Math.random() * 90000) + 10000)}</div>
                <div className="text-xs">
                  DATA: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>
            
            <div className="border-t-2 border-black pt-4">
              <h2 className="text-center text-lg font-bold text-black">
                RELATÓRIO DE ATENDIMENTO A CLIENTE
              </h2>
            </div>
          </div>

          {/* Trip information section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-black mb-4 text-center">INFORMAÇÕES DA VIAGEM</h3>
            
            <div className="space-y-4">
              {/* Client */}
              <div className="flex items-center">
                <span className="text-sm font-bold text-black w-32">CLIENTE:</span>
                <div className="flex-1 border-b border-black h-8 flex items-end pb-1">
                  <span className="text-sm text-black">{trip.clients?.name || trip.sector}</span>
                </div>
              </div>

              {/* City */}
              <div className="flex items-center">
                <span className="text-sm font-bold text-black w-32">CIDADE:</span>
                <div className="flex-1 border-b border-black h-8 flex items-end pb-1">
                  <span className="text-sm text-black">{trip.clients?.municipality || 'Não informado'}</span>
                </div>
              </div>

              {/* Trip description */}
              <div className="flex items-start">
                <span className="text-sm font-bold text-black w-32">DESCRIÇÃO:</span>
                <div className="flex-1 border-b border-black min-h-[32px] flex items-end pb-1">
                  <span className="text-sm text-black">{trip.description || trip.title}</span>
                </div>
              </div>

              {/* Employee - mostrar apenas quem está imprimindo */}
              <div className="flex items-center">
                <span className="text-sm font-bold text-black w-32">FUNCIONÁRIO:</span>
                <div className="flex-1 border-b border-black h-8 flex items-end pb-1">
                  <span className="text-sm text-black">
                    {displayName}
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center">
                <span className="text-sm font-bold text-black w-32">DATA:</span>
                <div className="flex-1 border-b border-black h-8 flex items-end pb-1">
                  <span className="text-sm text-black">{format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Se houver relato do funcionário atual, mostrar o relato; senão, manter a lista de presença */}
          {!narrativeLoading && narrative ? (
            <div className="space-y-6 mt-16">
              <h3 className="text-lg font-bold text-black text-center mb-8">RELATO DA VIAGEM</h3>
              <div className="border-2 border-black p-4 min-h-[320px] whitespace-pre-wrap text-sm leading-relaxed">
                {narrative}
              </div>
            </div>
          ) : (
            <div className="space-y-6 mt-16">
              <h3 className="text-lg font-bold text-black text-center mb-8">LISTA DE PRESENÇA</h3>
              
              {/* Header for signature columns */}
              <div className="grid grid-cols-2 gap-8 mb-4">
                <div className="text-center">
                  <span className="text-sm font-bold text-black">NOME COMPLETO</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-black">UNIDADE/SETOR</span>
                </div>
              </div>

              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="grid grid-cols-2 gap-8 items-center">
                  <div className="flex items-center">
                    <span className="text-sm text-black font-medium w-8 mr-4">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    <div className="flex-1 border-b-2 border-black h-8"></div>
                  </div>
                  <div className="border-b-2 border-black h-8"></div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-32 pt-8 border-t border-black text-center">
            <p className="text-xs text-black">
              OPPORTUNITY SISTEMAS - Sistema de Gestão Empresarial
            </p>
            <p className="text-xs text-black mt-1">
              Página 1 de 1 - Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
