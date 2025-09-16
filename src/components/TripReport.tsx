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
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
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
            height: 100%;
          }
          
          .no-print {
            display: none !important;
          }
          
          @page {
            margin: 15mm;
            size: A4;
          }

          .page {
            width: 100%;
            height: 257mm; /* A4 height minus margins */
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #000;
            background: white;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          .page:last-child {
            page-break-after: auto;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
            flex-shrink: 0;
          }

          .company-name {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .company-address {
            font-size: 9pt;
            line-height: 1.2;
          }

          .title {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            text-transform: uppercase;
            flex-shrink: 0;
          }

          .info {
            margin-bottom: 15px;
            flex-shrink: 0;
          }

          .info p {
            margin: 3px 0;
            font-size: 11pt;
          }

          .narrative {
            border: 1px solid #333;
            padding: 15px;
            margin: 10px 0;
            white-space: pre-wrap;
            font-size: 11pt;
            line-height: 1.4;
            flex: 1;
            overflow: hidden;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            flex: 1;
          }

          .table th,
          .table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            height: 35px;
          }

          .table th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 11pt;
          }

          .footer {
            text-align: center;
            font-size: 9pt;
            border-top: 1px solid #333;
            padding-top: 8px;
            margin-top: 15px;
            flex-shrink: 0;
          }
        }
        
        @media screen {
          .print-content {
            padding: 20px;
            max-width: 210mm;
            margin: 0 auto;
          }
          
          .page {
            border: 1px solid #ddd;
            margin-bottom: 20px;
            padding: 20px;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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

      {/* Print Content - EXACTLY 2 PAGES */}
      <div className="print-content">
        {/* PAGE 1 - NARRATIVE */}
        <div className="page">
          <div className="header">
            <div className="company-name">OPPORTUNITY SISTEMAS</div>
            <div className="company-address">
              Rua Benedito Francisco Vicente da Silva, Nº 17 - Centro - Pinheiral / RJ<br/>
              Tel: (24) 3112-6870 | CNPJ: 12.345.678/0001-90
            </div>
          </div>

          <div className="title">Relato da Viagem</div>

          <div className="info">
            <p><strong>Funcionário:</strong> {selectedEmployeeName}</p>
            <p><strong>Data:</strong> {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>

          <div className="narrative">
            {!narrativeLoading && narrative ? (
              narrative
            ) : (
              "Nenhum relato foi fornecido para esta viagem."
            )}
          </div>

          <div className="footer">
            Página 1 de 2
          </div>
        </div>

        {/* PAGE 2 - ATTENDANCE LIST */}
        <div className="page">
          <div className="header">
            <div className="company-name">OPPORTUNITY SISTEMAS</div>
            <div className="company-address">
              Rua Benedito Francisco Vicente da Silva, Nº 17 - Centro - Pinheiral / RJ<br/>
              Tel: (24) 3112-6870 | CNPJ: 12.345.678/0001-90
            </div>
          </div>

          <div className="title">Lista de Presença</div>

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Nome</th>
                <th style={{ width: '60%' }}>Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => (
                <tr key={i}>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer">
            Página 2 de 2
          </div>
        </div>
      </div>
    </div>
  );
}