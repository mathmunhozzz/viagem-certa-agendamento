import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  };
  onClose: () => void;
}

export function TripReport({ trip, onClose }: TripReportProps) {
  const handlePrint = () => {
    window.print();
  };

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

      {/* Report content */}
      <div className="print-content">
        <div className="print-page max-w-4xl mx-auto bg-white p-8 min-h-screen text-black">
          {/* Header identical to provided document */}
          <div className="mb-16">
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-black mb-2 tracking-wide">OPPORTUNITY SISTEMAS</h1>
                <div className="text-sm text-black space-y-1">
                  <p>Rua dos Comerciários, 1234 - Centro - Cascavel/PR - CEP: 85801-050</p>
                  <p>Tel: (45) 3220-7070 - contato@opportunity.com.br</p>
                  <p>CNPJ: 12.345.678/0001-90</p>
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

          {/* 15 signature lines in the middle of the page */}
          <div className="space-y-8 mt-32">
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} className="flex items-center">
                <span className="text-sm text-black font-medium w-16 mr-4">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <div className="flex-1 border-b-2 border-black h-8"></div>
              </div>
            ))}
          </div>

          {/* Footer with company info */}
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