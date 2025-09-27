import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, FileText, Filter, Calendar, Car, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateInspectionPDF, PDFInspectionData } from "@/utils/pdfGenerator";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReportViewer from "@/components/ReportViewer";

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
          ),
          damage_markers (
            *,
            damage_marker_photos (photo_url)
          )
        `)
        .eq("id", reportId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Erro",
          description: "Relatório não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Generate PDF using the new generator
      await generateInspectionPDF(data as PDFInspectionData);
      
      toast({
        title: "PDF Gerado",
        description: "Relatório baixado com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do relatório",
        variant: "destructive"
      });
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm("Tem certeza que deseja excluir este relatório?")) return;

    try {
      const { error } = await supabase
        .from("inspections")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Relatório excluído com sucesso!"
      });
      
      fetchReports();
    } catch (error) {
      console.error("Erro ao excluir relatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir relatório",
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar ao Dashboard</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                <span className="hidden sm:inline">Relatórios de Inspeções</span>
                <span className="sm:hidden">Relatórios</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                <span className="hidden sm:inline">Visualize e exporte relatórios detalhados</span>
                <span className="sm:hidden">Relatórios de inspeção</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={printReport} variant="outline" className="gap-2 flex-1 sm:flex-none">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
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
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={applyFilters} className="gap-2 flex-1 sm:flex-none">
                <Filter className="h-4 w-4" />
                Aplicar Filtros
              </Button>
              <Button onClick={clearFilters} variant="outline" className="flex-1 sm:flex-none">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Relatórios - Responsive Design */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Relatórios Encontrados ({reports.length})</CardTitle>
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
              <>
                {/* Mobile View - Cards */}
                <div className="block sm:hidden space-y-4">
                  {reports.map((report) => {
                    const summary = getStatusSummary(report.inspection_items);
                    return (
                      <Card key={report.id} className="border border-border/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <Badge variant="outline" className="text-sm font-medium mb-2">
                                {report.vehicle?.placa}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex gap-2 text-xs">
                              {summary.needs_replacement > 0 && (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  {summary.needs_replacement}
                                </Badge>
                              )}
                              {summary.observation > 0 && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  {summary.observation}
                                </Badge>
                              )}
                              {summary.ok > 0 && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {summary.ok}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">{report.vehicle?.marca_modelo}</p>
                              <p className="text-xs text-muted-foreground">{report.driver_name}</p>
                            </div>
                            <div className="flex gap-1">
                              <ReportViewer reportId={report.id}>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </ReportViewer>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => downloadPDF(report.id)}
                                title="Baixar PDF"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={() => deleteReport(report.id)}
                                title="Excluir"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden sm:block overflow-x-auto">
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
                               <Badge variant={report.vehicle?.vehicle_type === "car" ? "default" : "secondary"}>
                                 {report.vehicle?.vehicle_type === "car" ? (
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
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteReport(report.id)}
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};