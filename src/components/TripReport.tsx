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
        <div className="print-page max-w-4xl mx-auto bg-background p-8 min-h-screen">
          {/* Header */}
          <div className="border-b-2 border-border pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-primary mb-2">OPPORTUNITY SISTEMAS</h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestão de Viagens</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Data de Emissão:</p>
                <p className="font-medium">{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
          </div>

          {/* Report title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground mb-2">RELATÓRIO DE ATENDIMENTO A CLIENTE</h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </div>

          {/* Client section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Cliente:</label>
                <div className="border-b border-border pb-1 mt-1">
                  <p className="font-medium">{trip.sector}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Data Atendimento:</label>
                <div className="border-b border-border pb-1 mt-1">
                  <p className="font-medium">{format(parseISO(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tipo de Serviço:</label>
                <div className="border-b border-border pb-1 mt-1">
                  <p className="font-medium">Transporte / Deslocamento</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Situação:</label>
                <div className="border-b border-border pb-1 mt-1">
                  <p className="font-medium">{getStatusText(trip.status)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Horário:</label>
                <div className="border-b border-border pb-1 mt-1">
                  <p className="font-medium">{trip.departure_time || 'Não informado'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Sistema:</label>
                <div className="border-b border-border pb-1 mt-1">
                  <p className="font-medium">{trip.sector}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service description */}
          <div className="mb-8">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide block mb-2">Solicitação / Descrição do Serviço:</label>
            <div className="border border-border rounded-md p-4 min-h-[120px]">
              <p className="text-sm leading-relaxed">{trip.description || trip.title}</p>
            </div>
          </div>

          {/* Participants */}
          <div className="mb-8">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide block mb-2">Participantes:</label>
            <div className="border border-border rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {trip.employees?.map((employee, index) => (
                  <div key={employee.id} className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm">{employee.name} (Funcionário)</span>
                  </div>
                ))}
                {trip.travelers.map((traveler, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                      {(trip.employees?.length || 0) + index + 1}
                    </span>
                    <span className="text-sm">{traveler}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle information */}
          {trip.vehicle && (
            <div className="mb-8">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide block mb-2">Veículo Utilizado:</label>
              <div className="border border-border rounded-md p-4">
                <p className="text-sm">
                  <span className="font-medium">{trip.vehicle.brand} {trip.vehicle.model}</span>
                  {trip.vehicle.plate && <span> - Placa: {trip.vehicle.plate}</span>}
                </p>
              </div>
            </div>
          )}

          {/* Technical responsible section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide block mb-2">Técnico Responsável:</label>
              <div className="border-b border-border pb-1">
                <p className="font-medium">Sistema Opportunity</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide block mb-2">Data:</label>
              <div className="border-b border-border pb-1">
                <p className="font-medium">{format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="text-center">
              <div className="border-t border-border pt-2 mt-16">
                <p className="text-sm font-medium">Assinatura do Técnico</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-border pt-2 mt-16">
                <p className="text-sm font-medium">Assinatura do Cliente</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Relatório gerado automaticamente pelo Sistema de Gestão de Viagens - Opportunity Sistemas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}