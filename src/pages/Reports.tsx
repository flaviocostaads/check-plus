import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { ArrowLeft, Download, Printer, FileText, Filter, Calendar, Car, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReportViewer from "@/components/ReportViewer";
import ReportGenerator from "@/components/ReportGenerator";

interface ReportData {
  id: string;
  created_at: string;
  driver_name: string;
  driver_cpf: string;
  vehicle: {
    marca_modelo: string;
    placa: string;
    vehicle_type: string;
    cidade?: string;
    estado?: string;
  };
  inspection_items: Array<{
    status: string;
    checklist_template: {
      name: string;
    };
  }>;
}

export const Reports = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    vehicleId: "",
    driverName: "",
    plate: ""
  });

  useEffect(() => {
    fetchReports();
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("marca_modelo");

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error("Erro ao buscar veículos:", error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("inspections")
        .select(`
          id,
          created_at,
          driver_name,
          driver_cpf,
          vehicles!inner (
            marca_modelo,
            placa,
            vehicle_type,
            cidade,
            estado
          ),
          inspection_items (
            status,
            checklist_templates (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate + "T23:59:59");
      }
      if (filters.vehicleId && filters.vehicleId !== "all") {
        query = query.eq("vehicle_id", filters.vehicleId);
      }
      if (filters.driverName) {
        query = query.ilike("driver_name", `%${filters.driverName}%`);
      }
      if (filters.plate) {
        query = query.eq("vehicles.placa", filters.plate.toUpperCase());
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        vehicle: item.vehicles,
        inspection_items: item.inspection_items?.map(inspectionItem => ({
          ...inspectionItem,
          checklist_template: inspectionItem.checklist_templates
        })) || []
      })) || [];

      setReports(formattedData);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchReports();
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      vehicleId: "",
      driverName: "",
      plate: ""
    });
    setTimeout(() => fetchReports(), 100);
  };

  const downloadPDF = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from("inspections")
        .select(`
          *,
          vehicles (*),
          inspection_items (
            *,
            checklist_templates (name, requires_photo),
            inspection_photos (photo_url)
          )
        `)
        .eq("id", reportId)
        .single();

      if (error) throw error;

      // Transform data to match ReportGenerator interface
      const inspectionData = {
        id: data.id,
        createdAt: new Date(data.created_at),
        vehicleData: {
          marca_modelo: data.vehicles.marca_modelo,
          placa: data.vehicles.placa,
          cor: data.vehicles.cor,
          ano: data.vehicles.ano,
          renavam: data.vehicles.renavam,
          km_atual: data.vehicles.km_atual || "N/A"
        },
        driverData: {
          nome_completo: data.driver_name,
          cpf: data.driver_cpf,
          cnh_numero: data.driver_cnh,
          cnh_validade: data.driver_cnh_validade
        },
        checklistItems: data.inspection_items?.map((item: any) => ({
          id: item.id,
          name: item.checklist_templates.name,
          status: item.status,
          observations: item.observations,
          photos: item.inspection_photos?.map((p: any) => p.photo_url) || []
        })) || []
      };

      // Create a temporary ReportGenerator to trigger download
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);
      
      // Import ReportGenerator dynamically and trigger PDF generation
      const { default: ReportGenerator } = await import('@/components/ReportGenerator');
      
      // Simulate the PDF generation
      const generator = new (ReportGenerator as any)({ 
        inspection: inspectionData 
      });
      
      // Trigger PDF generation directly
      generator.generatePDF();
      
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do relatório",
        variant: "destructive"
      });
    }
  };

  const printReport = () => {
    window.print();
  };

  const getStatusSummary = (inspectionItems: any[]) => {
    const summary = {
      ok: 0,
      needs_replacement: 0,
      observation: 0
    };
    
    inspectionItems.forEach(item => {
      if (item.status === "ok") summary.ok++;
      else if (item.status === "needs_replacement") summary.needs_replacement++;
      else if (item.status === "observation") summary.observation++;
    });
    
    return summary;
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-8 w-8" />
                Relatórios de Inspeções
              </h1>
              <p className="text-muted-foreground">Visualize e exporte relatórios detalhados</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={printReport} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Veículo</Label>
                <Select value={filters.vehicleId} onValueChange={(value) => setFilters({...filters, vehicleId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.marca_modelo} - {vehicle.placa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverName">Nome do Motorista</Label>
                <Input
                  id="driverName"
                  value={filters.driverName}
                  onChange={(e) => setFilters({...filters, driverName: e.target.value})}
                  placeholder="Digite o nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plate">Placa</Label>
                <Input
                  id="plate"
                  value={filters.plate}
                  onChange={(e) => setFilters({...filters, plate: e.target.value.toUpperCase()})}
                  placeholder="ABC1234"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="gap-2">
                <Filter className="h-4 w-4" />
                Aplicar Filtros
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Relatórios */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Encontrados ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando relatórios...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum relatório encontrado com os filtros aplicados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Status Geral</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const summary = getStatusSummary(report.inspection_items);
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{report.vehicle?.marca_modelo}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.vehicle?.placa}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={report.vehicle?.vehicle_type === "carro" ? "default" : "secondary"}>
                              {report.vehicle?.vehicle_type === "carro" ? (
                                <><Car className="h-3 w-3 mr-1" />Carro</>
                              ) : (
                                <>Moto</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {report.vehicle?.cidade && report.vehicle?.estado 
                              ? `${report.vehicle.cidade}/${report.vehicle.estado}`
                              : "-"
                            }
                          </TableCell>
                          <TableCell>{report.driver_name}</TableCell>
                          <TableCell>{report.driver_cpf}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-2 text-xs">
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  OK: {summary.ok}
                                </Badge>
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  Trocar: {summary.needs_replacement}
                                </Badge>
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  Obs: {summary.observation}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <ReportViewer reportId={report.id}>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Visualizar
                                </Button>
                              </ReportViewer>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => downloadPDF(report.id)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};