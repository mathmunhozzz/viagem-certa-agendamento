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
  
  // Employee selection for admin/manager users
  const isAdminOrManager = hasRole('admin') || hasRole('manager');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');

  const [formNumber] = useState(() => String(Math.floor(Math.random() * 90000) + 10000));

  // Set initial selectedEmployeeId when component loads
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
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 z-50 overflow-auto">
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
          
          @page {
            margin: 15mm;
            size: A4;
          }

          .print-page {
            width: auto !important;
            max-width: none !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            background: white !important;
            color: #1a1a1a !important;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            page-break-after: avoid;
          }

          .page-break {
            page-break-after: always;
          }

          /* Modern Corporate Header */
          .corporate-header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            margin: -20mm -20mm 25mm -20mm;
            padding: 20mm 20mm 15mm 20mm;
            color: white;
            page-break-inside: avoid;
          }
          
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .company-info {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .logo-container {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 10px;
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .company-details h1 {
            font-size: 28pt;
            font-weight: 700;
            margin: 0 0 8px 0;
            letter-spacing: -0.02em;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .company-details p {
            font-size: 10pt;
            margin: 2px 0;
            opacity: 0.95;
          }
          
          .form-info {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 15px 20px;
            text-align: center;
            min-width: 160px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .form-info .form-label {
            font-size: 9pt;
            font-weight: 600;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .form-info .form-number {
            font-size: 22pt;
            font-weight: 800;
            margin: 8px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .form-info .form-date {
            font-size: 9pt;
            opacity: 0.9;
          }

          /* Section Title */
          .section-banner {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            margin: 0 -20mm 25mm -20mm;
            padding: 12mm 20mm;
            border-left: 6px solid #3b82f6;
          }
          
          .section-title {
            font-size: 18pt;
            font-weight: 700;
            color: #1e40af;
            margin: 0;
            text-align: center;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          /* Content Areas */
          .narrative-container {
            background: #ffffff;
            border-radius: 8px;
            padding: 20mm;
            margin: 0 -20mm;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
            min-height: 300px;
          }
          
          .narrative-content {
            font-size: 11pt;
            line-height: 1.6;
            color: #374151;
            white-space: pre-wrap;
            font-family: 'Times New Roman', serif;
          }

          .attendance-container {
            background: #ffffff;
            border-radius: 8px;
            padding: 15mm 20mm 20mm 20mm;
            margin: 0 -20mm;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
          }
          
          .attendance-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10mm;
          }
          
          .attendance-table th {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 12px 15px;
            font-size: 11pt;
            font-weight: 600;
            text-align: left;
            border: none;
          }
          
          .attendance-table th:first-child {
            border-top-left-radius: 6px;
            border-bottom-left-radius: 6px;
          }
          
          .attendance-table th:last-child {
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
          }
          
          .attendance-table td {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10pt;
          }
          
          .attendance-table tr:nth-child(even) td {
            background: #f9fafb;
          }
          
          .attendance-table tr:hover td {
            background: #f3f4f6;
          }

          /* Footer */
          .corporate-footer {
            margin-top: 25mm;
            padding-top: 10mm;
            border-top: 2px solid #e2e8f0;
            text-align: center;
          }
          
          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
            color: #6b7280;
          }
          
          .footer-brand {
            font-weight: 600;
            color: #374151;
          }
          
          .footer-page {
            font-style: italic;
          }
        }

        /* Screen styles for better preview */
        .screen-header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3);
        }
        
        .screen-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
      `}</style>

      {/* Control Panel */}
      <div className="no-print fixed top-6 right-6 flex gap-3 z-10">
        {isAdminOrManager && trip.employees?.length && (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
            <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário do relato:</label>
            <Select
              value={selectedEmployeeId || ''}
              onValueChange={(value) => {
                setSelectedEmployeeId(value);
                const emp = trip.employees?.find(e => e.id === value);
                setSelectedEmployeeName(emp?.name || '');
              }}
            >
              <SelectTrigger className="w-56 bg-white">
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
        
        <div className="flex gap-3">
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!selectedEmployeeId ? 'Selecione um funcionário para relatar a viagem' : 'Escrever/editar relato da viagem'}
            disabled={!selectedEmployeeId}
          >
            ✏️ Relatar viagem
          </button>
          
          {!narrativeLoading && narrative && (
            <button
              onClick={handlePrintReport}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              🖨️ Imprimir Relatório
            </button>
          )}
          
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            ✕ Fechar
          </button>
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

      {/* Print Content */}
      <div className="print-content">
        {/* PAGE 1 - NARRATIVE */}
        <div className="print-page max-w-5xl mx-auto bg-white min-h-screen page-break">
          {/* Corporate Header */}
          <div className="corporate-header screen-header">
            <div className="header-content">
              <div className="company-info">
                <div className="logo-container">
                  <img 
                    src="/lovable-uploads/a031923e-3408-476a-8ad3-0b0de5cc4585.png" 
                    alt="Opportunity Sistemas Logo" 
                    className="w-full h-full object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="company-details">
                  <h1>OPPORTUNITY SISTEMAS</h1>
                  <p>Rua Benedito Francisco Vicente da Silva, Nº 17 - Centro - Pinheiral / RJ</p>
                  <p>📞 (24) 3112-6870 | CNPJ: 12.345.678/0001-90</p>
                  <p>🌐 www.opportunitysistemas.com.br</p>
                </div>
              </div>
              
              <div className="form-info">
                <div className="form-label">Formulário Nº</div>
                <div className="form-number">{formNumber}</div>
                <div className="form-date">
                  📅 {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>
          </div>

          {/* Section Banner */}
          <div className="section-banner">
            <h2 className="section-title">📝 Relato da Viagem</h2>
          </div>

          {/* Trip Information */}
          <div className="screen-content mb-6">
            <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
              <div>
                <span className="font-semibold text-gray-600">Título:</span>
                <p className="text-gray-800 mt-1">{trip.title}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Data da Viagem:</span>
                <p className="text-gray-800 mt-1">
                  {format(new Date(trip.trip_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Funcionário:</span>
                <p className="text-gray-800 mt-1">{selectedEmployeeName}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Setor:</span>
                <p className="text-gray-800 mt-1">{trip.sector}</p>
              </div>
            </div>
          </div>

          {/* Narrative Content */}
          <div className="narrative-container screen-content">
            {!narrativeLoading && narrative ? (
              <div className="narrative-content">{narrative}</div>
            ) : (
              <div className="narrative-content text-gray-400 italic">
                Nenhum relato foi fornecido para esta viagem...
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="corporate-footer">
            <div className="footer-content">
              <div className="footer-brand">OPPORTUNITY SISTEMAS - Sistema de Gestão Empresarial</div>
              <div className="footer-page">
                Página 1 de 2 | Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2 - ATTENDANCE LIST */}
        <div className="print-page max-w-5xl mx-auto bg-white min-h-screen">
          {/* Corporate Header */}
          <div className="corporate-header screen-header">
            <div className="header-content">
              <div className="company-info">
                <div className="logo-container">
                  <img 
                    src="/lovable-uploads/a031923e-3408-476a-8ad3-0b0de5cc4585.png" 
                    alt="Opportunity Sistemas Logo" 
                    className="w-full h-full object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="company-details">
                  <h1>OPPORTUNITY SISTEMAS</h1>
                  <p>Rua Benedito Francisco Vicente da Silva, Nº 17 - Centro - Pinheiral / RJ</p>
                  <p>📞 (24) 3112-6870 | CNPJ: 12.345.678/0001-90</p>
                  <p>🌐 www.opportunitysistemas.com.br</p>
                </div>
              </div>
              
              <div className="form-info">
                <div className="form-label">Formulário Nº</div>
                <div className="form-number">{formNumber}</div>
                <div className="form-date">
                  📅 {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>
          </div>

          {/* Section Banner */}
          <div className="section-banner">
            <h2 className="section-title">📋 Lista de Presença</h2>
          </div>

          {/* Attendance Table */}
          <div className="attendance-container screen-content">
            <div className="text-sm text-gray-600 mb-4">
              <strong>Instrução:</strong> Todos os participantes da viagem devem assinar abaixo para confirmação de presença.
            </div>
            
            <table className="attendance-table">
              <thead>
                <tr>
                  <th style={{width: '60%'}}>📝 Nome Completo & Assinatura</th>
                  <th style={{width: '40%'}}>🏢 Unidade / Setor</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 20 }, (_, i) => (
                  <tr key={i}>
                    <td style={{height: '35px'}}></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="corporate-footer">
            <div className="footer-content">
              <div className="footer-brand">OPPORTUNITY SISTEMAS - Sistema de Gestão Empresarial</div>
              <div className="footer-page">
                Página 2 de 2 | Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}