import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Eye, Download, Trash2, Car, Bike, Filter, Search, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de visualização em desenvolvimento"
    });
  };

  const handleDownload = (inspectionId: string) => {
    toast({
      title: "Em desenvolvimento", 
      description: "Funcionalidade de download em desenvolvimento"
    });
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
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Histórico de Inspeções</h1>
              <p className="text-muted-foreground">Consulte o histórico completo de inspeções realizadas</p>
            </div>
          </div>
        </div>

        {/* Filtros de Busca */}
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Relatórios de Inspeção</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : filteredInspections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma inspeção encontrada
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
                          <Badge variant={inspection.vehicles.vehicle_type === "carro" ? "default" : "secondary"}>
                            {inspection.vehicles.vehicle_type === "carro" ? (
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(inspection.id)}
                              title="Visualizar"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(inspection.id)}
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
            )}
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default InspectionHistory;