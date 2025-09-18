import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, Car, Bike } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VehicleType } from "@/types/inspection";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InspectionHistoryItem {
  id: string;
  driver_name: string;
  driver_cpf: string;
  created_at: string;
  vehicles: {
    id: string;
    marca_modelo: string;
    placa: string;
    vehicle_type: VehicleType;
  };
}

const InspectionHistory = () => {
  const [inspections, setInspections] = useState<InspectionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, []);

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
    } catch (error) {
      console.error("Erro ao buscar inspeções:", error);
      toast.error("Erro ao carregar histórico de inspeções");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (inspectionId: string) => {
    // Implementar visualização detalhada da inspeção
    toast.info("Funcionalidade de visualização em desenvolvimento");
  };

  const handleDownload = (inspectionId: string) => {
    // Implementar download do relatório
    toast.info("Funcionalidade de download em desenvolvimento");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta inspeção?")) return;

    try {
      const { error } = await supabase
        .from("inspections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Inspeção excluída com sucesso!");
      fetchInspections();
    } catch (error) {
      console.error("Erro ao excluir inspeção:", error);
      toast.error("Erro ao excluir inspeção");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Histórico de Inspeções</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Inspeção</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma inspeção encontrada
            </div>
          ) : (
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
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">
                      {formatDate(inspection.created_at)}
                    </TableCell>
                    <TableCell>{inspection.vehicles.marca_modelo}</TableCell>
                    <TableCell>{inspection.vehicles.placa}</TableCell>
                    <TableCell>
                      <Badge variant={inspection.vehicles.vehicle_type === 'car' ? 'default' : 'secondary'}>
                        {inspection.vehicles.vehicle_type === 'car' ? (
                          <><Car className="h-3 w-3 mr-1" /> Carro</>
                        ) : (
                          <><Bike className="h-3 w-3 mr-1" /> Moto</>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionHistory;