import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, Car, Bike, Filter, Search, ArrowLeft, ClipboardList } from "lucide-react";
import ReportViewer from "@/components/ReportViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateInspectionPDF, PDFInspectionData } from "@/utils/pdfGenerator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface InspectionHistoryItem {
  id: string;
  driver_name: string;
  driver_cpf: string;
  created_at: string;
  vehicles: {
    id: string;
    marca_modelo: string;
    placa: string;
    vehicle_type: string;
  };
}

export const InspectionHistory = () => {
  const [inspections, setInspections] = useState<InspectionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [filteredInspections, setFilteredInspections] = useState<InspectionHistoryItem[]>([]);

  useEffect(() => {
    fetchInspections();
  }, []);

  useEffect(() => {
    let filtered = inspections;
    
    if (searchTerm) {
      filtered = filtered.filter(inspection => 
        inspection.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.vehicles.marca_modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.vehicles.placa.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(inspection => 
        format(new Date(inspection.created_at), "yyyy-MM-dd") === dateFilter
      );
    }
    
    setFilteredInspections(filtered);
  }, [inspections, searchTerm, dateFilter]);

  const fetchInspections = async () => {
    try {
      const { data, error } = await supabase
        .from("inspections")
        .select(`
          id,
          driver_name,
          driver_cpf,
          created_at,
          vehicles (
            id,
            marca_modelo,
            placa,
            vehicle_type
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInspections(data || []);
      setFilteredInspections(data || []);
    } catch (error) {
      console.error("Erro ao buscar inspeções:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de inspeções",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (inspectionId: string) => {
    // This will be handled by ReportViewer component
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

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta inspeção?")) return;

    try {
      const { error } = await supabase
        .from("inspections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Inspeção excluída com sucesso!"
      });
      fetchInspections();
    } catch (error) {
      console.error("Erro ao excluir inspeção:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir inspeção",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-7xl mx-auto space-y-6 p-6">
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
              <h1 className="text-xl sm:text-3xl font-bold text-primary flex items-center gap-2">
                <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8" />
                <span className="hidden sm:inline">Histórico de Inspeções</span>
                <span className="sm:hidden">Histórico</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                <span className="hidden sm:inline">Consulte o histórico completo de inspeções realizadas</span>
                <span className="sm:hidden">Histórico de inspeções</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filtros de Busca - Mobile Responsive */}
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por motorista, veículo ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              placeholder="Filtrar por data"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setDateFilter("");
              }}
              className="w-full lg:w-auto"
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Relatórios de Inspeção</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : filteredInspections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma inspeção encontrada
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="block sm:hidden space-y-4">
                  {filteredInspections.map((inspection) => (
                    <Card key={inspection.id} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <Badge variant="outline" className="text-sm font-medium mb-2">
                              {inspection.vehicles.placa}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(inspection.created_at)}
                            </p>
                          </div>
                           <Badge variant={inspection.vehicles.vehicle_type === "car" ? "default" : "secondary"}>
                             {inspection.vehicles.vehicle_type === "car" ? (
                               <><Car className="h-3 w-3 mr-1" />Carro</>
                             ) : (
                               <><Bike className="h-3 w-3 mr-1" />Moto</>
                             )}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{inspection.vehicles.marca_modelo}</p>
                            <p className="text-xs text-muted-foreground">{inspection.driver_name}</p>
                          </div>
                          <div className="flex gap-1">
                            <ReportViewer reportId={inspection.id}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                title="Visualizar"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </ReportViewer>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => downloadPDF(inspection.id)}
                              title="Download PDF"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(inspection.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                        <TableHead>Motorista</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInspections.map((inspection) => (
                        <TableRow key={inspection.id}>
                          <TableCell className="font-medium">
                            {formatDate(inspection.created_at)}
                          </TableCell>
                          <TableCell>{inspection.vehicles.marca_modelo}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{inspection.vehicles.placa}</Badge>
                          </TableCell>
                          <TableCell>
                             <Badge variant={inspection.vehicles.vehicle_type === "car" ? "default" : "secondary"}>
                               {inspection.vehicles.vehicle_type === "car" ? (
                                 <><Car className="h-3 w-3 mr-1" />Carro</>
                               ) : (
                                 <><Bike className="h-3 w-3 mr-1" />Moto</>
                               )}
                             </Badge>
                          </TableCell>
                          <TableCell>{inspection.driver_name}</TableCell>
                          <TableCell>{inspection.driver_cpf}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <ReportViewer reportId={inspection.id}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Visualizar"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </ReportViewer>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPDF(inspection.id)}
                                title="Download PDF"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(inspection.id)}
                                title="Excluir"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InspectionHistory;