import { format, parseISO } from 'date-fns';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return 'Agendada';
    }
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
            padding: 20px;
            box-shadow: none;
            background: white !important;
            color: black !important;
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
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-black mb-1">OPPORTUNITY SISTEMAS</h1>
                <p className="text-sm text-black">Rua Exemplo, 123 - Centro - Cidade/UF - CEP: 12345-678</p>
                <p className="text-sm text-black">Tel: (XX) XXXX-XXXX - email@opportunity.com.br</p>
              </div>
              <div className="text-right border border-black p-2 min-w-[200px]">
                <p className="text-xs text-black font-bold">RELATÓRIO Nº</p>
                <p className="text-lg font-bold text-black">{trip.id.substring(0, 8).toUpperCase()}</p>
                <p className="text-xs text-black">DATA: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>
          </div>

          {/* Report title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-black mb-4 border border-black p-3 bg-gray-100">
              RELATÓRIO DE ATENDIMENTO A CLIENTE
            </h2>
          </div>

          {/* Client information table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <tr>
                  <td className="border border-black p-2 bg-gray-100 font-bold w-1/6">CLIENTE:</td>
                  <td className="border border-black p-2 w-1/3">{trip.sector}</td>
                  <td className="border border-black p-2 bg-gray-100 font-bold w-1/6">DATA ATENDIMENTO:</td>
                  <td className="border border-black p-2 w-1/3">{format(parseISO(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 bg-gray-100 font-bold">TIPO DE SERVIÇO:</td>
                  <td className="border border-black p-2">Transporte / Deslocamento</td>
                  <td className="border border-black p-2 bg-gray-100 font-bold">SITUAÇÃO:</td>
                  <td className="border border-black p-2">{getStatusText(trip.status)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 bg-gray-100 font-bold">HORÁRIO:</td>
                  <td className="border border-black p-2">{trip.departure_time || 'Não informado'}</td>
                  <td className="border border-black p-2 bg-gray-100 font-bold">SISTEMA:</td>
                  <td className="border border-black p-2">{trip.sector}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Service description */}
          <div className="mb-6">
            <div className="border border-black">
              <div className="bg-gray-100 p-2 border-b border-black">
                <p className="font-bold text-sm text-black">SOLICITAÇÃO / DESCRIÇÃO DO SERVIÇO:</p>
              </div>
              <div className="p-3 min-h-[100px]">
                <p className="text-sm text-black leading-relaxed">{trip.description || trip.title}</p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="mb-6">
            <div className="border border-black">
              <div className="bg-gray-100 p-2 border-b border-black">
                <p className="font-bold text-sm text-black">PARTICIPANTES DO ATENDIMENTO:</p>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  {trip.employees?.map((employee, index) => (
                    <div key={employee.id} className="flex items-center">
                      <span className="text-sm text-black">• {employee.name} (Funcionário)</span>
                    </div>
                  ))}
                  {trip.travelers.map((traveler, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-sm text-black">• {traveler}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle information */}
          {trip.vehicle && (
            <div className="mb-6">
              <div className="border border-black">
                <div className="bg-gray-100 p-2 border-b border-black">
                  <p className="font-bold text-sm text-black">VEÍCULO UTILIZADO:</p>
                </div>
                <div className="p-3">
                  <p className="text-sm text-black">
                    {trip.vehicle.brand} {trip.vehicle.model}
                    {trip.vehicle.plate && <span> - Placa: {trip.vehicle.plate}</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service details */}
          <div className="mb-8">
            <div className="border border-black">
              <div className="bg-gray-100 p-2 border-b border-black">
                <p className="font-bold text-sm text-black">SERVIÇO EXECUTADO / OBSERVAÇÕES:</p>
              </div>
              <div className="p-3 min-h-[80px]">
                <p className="text-sm text-black">Serviço de transporte executado conforme solicitado.</p>
              </div>
            </div>
          </div>

          {/* Signatures section */}
          <div className="mt-12">
            <div className="grid grid-cols-2 gap-8">
              {/* Technical signature */}
              <div className="text-center">
                <div className="mb-8">
                  <p className="text-sm text-black mb-2">Técnico Responsável:</p>
                  <div className="border-b-2 border-black h-8 mb-2"></div>
                  <p className="text-xs text-black">Sistema Opportunity</p>
                  <p className="text-xs text-black">Data: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>

              {/* Client signature */}
              <div className="text-center">
                <div className="mb-8">
                  <p className="text-sm text-black mb-2">Cliente:</p>
                  <div className="border-b-2 border-black h-8 mb-2"></div>
                  <p className="text-xs text-black">Assinatura do Responsável</p>
                  <p className="text-xs text-black">Data: ___/___/______</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional signature fields */}
          <div className="mt-8 grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-sm text-black mb-2">Visto:</p>
              <div className="border-b-2 border-black h-8 mb-2"></div>
              <p className="text-xs text-black">Supervisor</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-black mb-2">Aprovação:</p>
              <div className="border-b-2 border-black h-8 mb-2"></div>
              <p className="text-xs text-black">Gerência</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t border-black">
            <p className="text-xs text-black">
              Este relatório foi gerado automaticamente pelo Sistema de Gestão de Viagens - Opportunity Sistemas
            </p>
            <p className="text-xs text-black mt-1">
              Página 1 de 1 - Relatório gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}