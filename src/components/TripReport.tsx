import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useCurrentUserDisplayName } from '@/hooks/useCurrentUserDisplayName';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { TripNarrativeDialog } from './TripNarrativeDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { employee } = useCurrentEmployee();
  const { displayName } = useCurrentUserDisplayName();
  const { hasRole } = useUserRole();

  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  const isAdminOrManager = hasRole('admin') || hasRole('manager');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');

  useEffect(() => {
    if (isAdminOrManager && trip.employees?.length) {
      const firstEmployee = trip.employees[0];
      setSelectedEmployeeId(firstEmployee.id);
      setSelectedEmployeeName(firstEmployee.name);
    } else if (employee?.id) {
      setSelectedEmployeeId(employee.id);
      setSelectedEmployeeName(displayName);
    }
  }, [isAdminOrManager, trip.employees, employee?.id, displayName]);

  useEffect(() => {
    const loadNarrative = async () => {
      if (!selectedEmployeeId) {
        setNarrative(null);
        setNarrativeLoading(false);
        return;
      }
      setNarrativeLoading(true);
      const { data, error } = await supabase
        .from('trip_reports')
        .select('content')
        .eq('trip_id', trip.id)
        .eq('employee_id', selectedEmployeeId);

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
  }, [selectedEmployeeId, trip.id]);

  const handlePrintReport = () => {
    // Hide the screen content and show only print content
    document.body.classList.add('print-mode');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-mode');
    }, 100);
  };

  return (
    <>
      <style>{`
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }
          
          body.print-mode * {
            visibility: hidden !important;
          }
          
          body.print-mode .report-print-content,
          body.print-mode .report-print-content * {
            visibility: visible !important;
          }
          
          .report-print-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
          }
          
          @page {
            margin: 15mm !important;
            size: A4 !important;
          }

          .print-page {
            width: 210mm !important;
            max-height: 267mm !important;
            height: auto !important;
            font-family: 'Arial', sans-serif !important;
            font-size: 11pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
          }
          
          .print-page.page-one {
            page-break-after: always !important;
          }
          
          .print-page.page-two {
            page-break-after: never !important;
            page-break-before: auto !important;
          }
          
          /* Force exactly 2 pages - hide any additional content */
          .print-page:nth-child(n+3) {
            display: none !important;
          }

          .report-header {
            background: linear-gradient(135deg, #1e40af, #3b82f6) !important;
            color: white !important;
            padding: 20px !important;
            text-align: center !important;
            margin-bottom: 20px !important;
            border-radius: 0 !important;
          }

          .company-logo {
            font-size: 24pt !important;
            font-weight: bold !important;
            margin-bottom: 5px !important;
            letter-spacing: 2px !important;
          }

          .company-tagline {
            font-size: 10pt !important;
            opacity: 0.9 !important;
            margin-bottom: 10px !important;
          }

          .report-title {
            font-size: 18pt !important;
            font-weight: bold !important;
            margin: 15px 0 !important;
            background: #f8fafc !important;
            color: #1e40af !important;
            padding: 10px !important;
            border-left: 4px solid #3b82f6 !important;
          }

          .info-section {
            background: #f8fafc !important;
            padding: 20px !important;
            margin-bottom: 25px !important;
            border-left: 4px solid #3b82f6 !important;
          }

          .info-item {
            display: flex !important;
            justify-content: space-between !important;
            margin: 8px 0 !important;
            font-size: 11pt !important;
            padding: 6px 0 !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }

          .info-label {
            font-weight: bold !important;
            color: #1e40af !important;
            min-width: 120px !important;
          }

          .info-value {
            color: #374151 !important;
            text-align: right !important;
          }

          .narrative-section {
            background: white !important;
            border: 2px solid #e2e8f0 !important;
            padding: 20px !important;
            margin: 20px 0 !important;
            border-radius: 0 !important;
          }

          .narrative-title {
            font-size: 14pt !important;
            font-weight: bold !important;
            color: #1e40af !important;
            margin-bottom: 15px !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
          }

          .narrative-content {
            font-size: 11pt !important;
            line-height: 1.6 !important;
            white-space: pre-wrap !important;
            color: #374151 !important;
            min-height: 120px !important;
            background: #fafafa !important;
            padding: 15px !important;
            border-left: 4px solid #10b981 !important;
          }

          .signature-section {
            margin-top: 30px !important;
            background: #f8fafc !important;
            padding: 20px !important;
            border-radius: 0 !important;
          }

          .signature-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 15px !important;
          }

          .signature-table th {
            background: #1e40af !important;
            color: white !important;
            padding: 12px !important;
            text-align: left !important;
            font-size: 11pt !important;
            font-weight: bold !important;
            border: 1px solid #1e40af !important;
          }

          .signature-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 15px !important;
            height: 40px !important;
            background: white !important;
          }


          .status-badge {
            display: inline-block !important;
            padding: 4px 12px !important;
            background: #10b981 !important;
            color: white !important;
            font-size: 9pt !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            border-radius: 0 !important;
          }

          .page-number {
            position: absolute !important;
            top: 10mm !important;
            right: 15mm !important;
            font-size: 9pt !important;
            color: #64748b !important;
          }
        }
        
        @media screen {
          .report-print-content {
            display: none;
          }
        }
      `}</style>

      {/* Screen UI Controls */}
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Relatório de Viagem Profissional</h1>
              <p className="text-blue-100">Sistema de Relatórios Avançado</p>
            </div>
            <div className="flex gap-3">
              {isAdminOrManager && trip.employees?.length && (
                <div className="bg-white/10 rounded-lg p-3">
                  <label className="block text-sm font-medium mb-2">Funcionário:</label>
                  <Select
                    value={selectedEmployeeId || ''}
                    onValueChange={(value) => {
                      setSelectedEmployeeId(value);
                      const emp = trip.employees?.find(e => e.id === value);
                      setSelectedEmployeeName(emp?.name || '');
                    }}
                  >
                    <SelectTrigger className="w-48 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trip.employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <button
                onClick={() => setDialogOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={!selectedEmployeeId}
              >
                📝 Editar Relato
              </button>
              
              <button
                onClick={handlePrintReport}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                🖨️ Imprimir Relatório
              </button>
              
              <button
                onClick={onClose}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ✕ Fechar
              </button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div className="max-w-4xl mx-auto bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 text-center">
              <div className="text-3xl font-bold mb-2 tracking-wider">OPPORTUNITY SISTEMAS</div>
              <div className="text-sm opacity-90 mb-3">Soluções Empresariais & Gestão de Viagens</div>
              <div className="text-lg font-semibold bg-white/20 inline-block px-4 py-2 rounded">
                RELATÓRIO DE VIAGEM EXECUTIVO
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 border-l-4 border-blue-500">
                  <h3 className="font-bold text-blue-700 text-lg mb-3 border-b pb-2">Informações da Viagem</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Título:</span>
                      <span className="text-gray-900">{trip.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Data:</span>
                      <span className="text-gray-900">{format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Horário:</span>
                      <span className="text-gray-900">{trip.departure_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Setor:</span>
                      <span className="text-gray-900">{trip.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Status:</span>
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold uppercase">{trip.status}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border-l-4 border-blue-500">
                  <h3 className="font-bold text-blue-700 text-lg mb-3 border-b pb-2">Recursos Utilizados</h3>
                  <div className="space-y-2 text-sm">
                    {trip.vehicle && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Veículo:</span>
                          <span className="text-gray-900">{trip.vehicle.brand} {trip.vehicle.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Placa:</span>
                          <span className="text-gray-900">{trip.vehicle.plate}</span>
                        </div>
                      </>
                    )}
                    {trip.clients && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Cliente:</span>
                          <span className="text-gray-900">{trip.clients.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Município:</span>
                          <span className="text-gray-900">{trip.clients.municipality}</span>
                        </div>
                      </>
                    )}
                    {trip.credit_card && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Cartão:</span>
                        <span className="text-gray-900">{trip.credit_card.brand} ****{trip.credit_card.last_four_digits}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Responsável:</span>
                      <span className="text-gray-900">{selectedEmployeeName}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 p-6 mb-8">
                <h3 className="text-xl font-bold text-blue-700 mb-4 uppercase tracking-wide">Relato Detalhado</h3>
                <div className="bg-gray-50 p-4 border-l-4 border-green-500 min-h-32">
                  {!narrativeLoading && narrative ? (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{narrative}</p>
                  ) : (
                    <p className="text-gray-500 italic">Nenhum relato foi fornecido para esta viagem.</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-6">
                <h3 className="text-xl font-bold text-blue-700 mb-4 uppercase tracking-wide">Lista de Presença</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-blue-700 text-white p-3 text-left font-bold">Nome Completo</th>
                      <th className="bg-blue-700 text-white p-3 text-left font-bold">Assinatura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }, (_, i) => (
                      <tr key={i} className="border-b">
                        <td className="border border-gray-300 p-4 bg-white h-12"></td>
                        <td className="border border-gray-300 p-4 bg-white h-12"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-Only Content */}
      <div className="report-print-content">
        <div className="print-page page-one">
          <div className="page-number">Página 1 de 2</div>
          
          <div className="report-header">
            <div className="company-logo">OPPORTUNITY SISTEMAS</div>
            <div className="company-tagline">Soluções Empresariais & Gestão de Viagens</div>
            <div className="company-tagline">Rua Benedito Francisco Vicente da Silva, Nº 17 - Centro - Pinheiral / RJ</div>
            <div className="company-tagline">Tel: (24) 3112-6870 | CNPJ: 12.345.678/0001-90</div>
          </div>

          <div className="report-title">RELATÓRIO DE VIAGEM</div>

          <div className="info-section">
            <div className="info-item">
              <span className="info-label">Data:</span>
              <span className="info-value">{format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Horário:</span>
              <span className="info-value">{trip.departure_time}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Setor:</span>
              <span className="info-value">{trip.sector}</span>
            </div>
            {trip.clients && (
              <>
                <div className="info-item">
                  <span className="info-label">Cliente:</span>
                  <span className="info-value">{trip.clients.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Município:</span>
                  <span className="info-value">{trip.clients.municipality}</span>
                </div>
              </>
            )}
          </div>

          <div className="narrative-section">
            <div className="narrative-title">Relato Detalhado da Viagem</div>
            <div className="narrative-content">
              {!narrativeLoading && narrative ? narrative : "Nenhum relato foi fornecido para esta viagem."}
            </div>
          </div>

        </div>

        <div className="print-page page-two">
          <div className="page-number">Página 2 de 2</div>

          <div className="report-title">LISTA DE PRESENÇA</div>

          <div className="signature-section">
            <p style={{ fontSize: '11pt', marginBottom: '15px', color: '#374151' }}>
              <strong>Viagem:</strong> {trip.title} | <strong>Data:</strong> {format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })} | <strong>Responsável:</strong> {selectedEmployeeName}
            </p>

            <table className="signature-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '45%' }}>Nome Completo</th>
                  <th style={{ width: '35%' }}>Assinatura</th>
                  <th style={{ width: '15%' }}>Hora</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 15 }, (_, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{String(i + 1).padStart(2, '0')}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <TripNarrativeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tripId={trip.id}
        employeeId={selectedEmployeeId}
        initialContent={narrative}
        onSaved={(content) => setNarrative(content)}
      />
    </>
  );
}