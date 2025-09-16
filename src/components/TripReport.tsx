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
    <div className="fixed inset-0 bg-white z-50">
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
            margin: 20mm;
            size: A4;
          }

          .report-page {
            width: 100%;
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background: white;
            margin: 0;
            padding: 20px 0;
          }

          .page-break {
            page-break-after: always;
          }

          .simple-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }

          .company-name {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 5px 0;
          }

          .company-address {
            font-size: 10pt;
            margin: 0;
          }

          .report-title {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            text-transform: uppercase;
          }

          .employee-info {
            margin-bottom: 30px;
          }

          .employee-info p {
            margin: 5px 0;
            font-size: 12pt;
          }

          .narrative-section {
            border: 1px solid #ccc;
            padding: 20px;
            margin: 20px 0;
            white-space: pre-wrap;
          }

          .attendance-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
          }

          .attendance-table th,
          .attendance-table td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
          }

          .attendance-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .signature-line {
            height: 40px;
            border-bottom: 1px solid #000;
          }

          .page-footer {
            text-align: center;
            font-size: 10pt;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 30px;
          }
        }
      `}</style>

      {/* Control Panel */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-10">
        {isAdminOrManager && trip.employees?.length && (
          <div className="bg-white rounded-lg p-3 shadow-lg border">
            <label className="block text-sm font-medium mb-2">Funcionário:</label>
            <Select
              value={selectedEmployeeId || ''}
              onValueChange={(value) => {
                setSelectedEmployeeId(value);
                const emp = trip.employees?.find(e => e.id === value);
                setSelectedEmployeeName(emp?.name || '');
              }}
            >
              <SelectTrigger className="w-48">
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
        
        <div className="flex gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={!selectedEmployeeId}
          >
            Editar Relato
          </button>
          
          <button
            onClick={handlePrintReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Imprimir
          </button>
          
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Fechar
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
        <div className="report-page page-break">
          <div className="simple-header">
            <h1 className="company-name">OPPORTUNITY SISTEMAS</h1>
            <p className="company-address">
              Rua Benedito Francisco Vicente da Silva, Nº 17 - Centro - Pinheiral / RJ<br/>
              Tel: (24) 3112-6870 | CNPJ: 12.345.678/0001-90
            </p>
          </div>

          <h2 className="report-title">Relato da Viagem</h2>

          <div className="employee-info">
            <p><strong>Funcionário:</strong> {selectedEmployeeName}</p>
            <p><strong>Data:</strong> {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>

          <div className="narrative-section">
            {!narrativeLoading && narrative ? (
              narrative
            ) : (
              "Nenhum relato foi fornecido para esta viagem."
            )}
          </div>

          <div className="page-footer">
            Página 1 de 2
          </div>
        </div>

        {/* PAGE 2 - ATTENDANCE LIST */}
        <div className="report-page">
          <div className="simple-header">
            <h1 className="company-name">OPPORTUNITY SISTEMAS</h1>
            <p className="company-address">
              Rua Benedito Francisco Vicente da Silva, Nº 17 - Centro - Pinheiral / RJ<br/>
              Tel: (24) 3112-6870 | CNPJ: 12.345.678/0001-90
            </p>
          </div>

          <h2 className="report-title">Lista de Presença</h2>

          <table className="attendance-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Nome</th>
                <th style={{ width: '60%' }}>Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => (
                <tr key={i}>
                  <td></td>
                  <td className="signature-line"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="page-footer">
            Página 2 de 2
          </div>
        </div>
      </div>
    </div>
  );
}