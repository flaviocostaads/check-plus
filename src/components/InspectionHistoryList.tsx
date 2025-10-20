import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Car, User, FileText, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Inspection {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  driver_name: string;
  inspector_id: string;
  created_at: string;
  vehicles: {
    marca_modelo: string;
    placa: string;
  } | null;
  inspector_name?: string;
}

interface InspectionHistoryListProps {
  filterId?: string;
  filterType?: 'driver' | 'vehicle';
}

export default function InspectionHistoryList({ filterId, filterType }: InspectionHistoryListProps) {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    fetchInspections();
    fetchFilters();
  }, [filterId, filterType]);

  const fetchFilters = async () => {
    try {
      // Buscar veículos
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("id, marca_modelo, placa")
        .order("marca_modelo");

      // Buscar motoristas usando função básica
      const { data: driversData } = await supabase.rpc('get_drivers_basic_info');

      setVehicles(vehiclesData || []);
      setDrivers(driversData || []);
    } catch (error) {
      console.error("Erro ao buscar filtros:", error);
    }
  };

  const fetchInspections = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("inspections")
        .select(`
          id,
          vehicle_id,
          driver_id,
          driver_name,
          inspector_id,
          created_at,
          vehicles (
            marca_modelo,
            placa
          )
        `)
        .order("created_at", { ascending: false });

      // Aplicar filtro se fornecido
      if (filterId && filterType === 'driver') {
        query = query.eq('driver_id', filterId);
      } else if (filterId && filterType === 'vehicle') {
        query = query.eq('vehicle_id', filterId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes dos inspetores
      if (data && data.length > 0) {
        const inspectorIds = [...new Set(data.map(i => i.inspector_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', inspectorIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.name]) || []);

        const inspectionsWithNames = data.map(inspection => ({
          ...inspection,
          inspector_name: profilesMap.get(inspection.inspector_id) || 'Desconhecido'
        }));

        setInspections(inspectionsWithNames);
      } else {
        setInspections([]);
      }
    } catch (error) {
      console.error("Erro ao buscar inspeções:", error);
      toast.error("Erro ao carregar histórico de inspeções");
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch = searchTerm === "" ||
      inspection.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehicles?.marca_modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehicles?.placa.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVehicle = selectedVehicle === "all" || inspection.vehicle_id === selectedVehicle;
    const matchesDriver = selectedDriver === "all" || 
      (inspection.driver_id && inspection.driver_id === selectedDriver);

    return matchesSearch && matchesVehicle && matchesDriver;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Histórico de Inspeções
          <Badge variant="secondary" className="ml-auto">
            {filteredInspections.length} inspeções
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        {!filterId && (
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por motorista, veículo ou placa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="vehicle-filter" className="text-sm">Filtrar por Veículo</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger id="vehicle-filter">
                    <SelectValue placeholder="Todos os veículos" />
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

              <div>
                <Label htmlFor="driver-filter" className="text-sm">Filtrar por Motorista</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger id="driver-filter">
                    <SelectValue placeholder="Todos os motoristas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os motoristas</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Inspeções */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando histórico...
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || selectedVehicle !== "all" || selectedDriver !== "all"
              ? "Nenhuma inspeção encontrada com os filtros aplicados"
              : "Nenhuma inspeção encontrada"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map((inspection) => (
              <Card 
                key={inspection.id}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/inspection/${inspection.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {inspection.vehicles?.marca_modelo || 'Veículo removido'}
                          </span>
                          <Badge variant="outline">
                            {inspection.vehicles?.placa || 'N/A'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {inspection.driver_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(inspection.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>

                      {inspection.inspector_name && (
                        <div className="text-xs text-muted-foreground">
                          Inspetor: {inspection.inspector_name}
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
