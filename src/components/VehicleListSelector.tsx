import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Search, Car, Bike, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  marca_modelo: string;
  placa: string;
  vehicle_type: string;
  cor: string;
  ano: string;
  photo_url?: string;
}

interface VehicleListSelectorProps {
  onSelect: (vehicle: Vehicle) => void;
}

export default function VehicleListSelector({ onSelect }: VehicleListSelectorProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('marca_modelo');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error("Erro ao carregar veículos");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (selectedVehicle) {
      onSelect(selectedVehicle);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.marca_modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Selecionar Veículo</h2>
        <p className="text-muted-foreground">Escolha o veículo para a inspeção</p>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Veículos Cadastrados</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar veículo por modelo ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Vehicle Selection */}
          {loading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Carregando veículos...</p>
            </div>
          ) : filteredVehicles.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedVehicleId === vehicle.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      {vehicle.vehicle_type === "moto" ? 
                        <Bike className="h-5 w-5 text-primary" /> : 
                        <Car className="h-5 w-5 text-primary" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{vehicle.marca_modelo}</p>
                        <Badge variant="outline">{vehicle.placa}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{vehicle.cor}</span>
                        <span>•</span>
                        <span>{vehicle.ano}</span>
                        <span>•</span>
                        <Badge variant={vehicle.vehicle_type === "carro" ? "default" : "secondary"}>
                          {vehicle.vehicle_type === "carro" ? "Carro" : "Moto"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum veículo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Tente ajustar os filtros de busca" : "Cadastre um veículo para continuar"}
              </p>
              <Button onClick={() => window.location.href = '/vehicles'}>
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar Veículos
              </Button>
            </div>
          )}

          <Button 
            variant="default" 
            size="lg" 
            className="w-full mt-6 bg-gradient-primary hover:opacity-90"
            disabled={!selectedVehicleId}
            onClick={handleSelect}
          >
            Continuar com Veículo Selecionado
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}