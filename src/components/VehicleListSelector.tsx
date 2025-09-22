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
  vehicleType?: 'car' | 'moto';
}

export default function VehicleListSelector({ onSelect, vehicleType }: VehicleListSelectorProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  useEffect(() => {
    fetchVehicles();
  }, [vehicleType]);

  const fetchVehicles = async () => {
    try {
      let query = supabase.from('vehicles').select('*');
      
      // Filter by vehicle type if specified
      if (vehicleType) {
        // Ensure proper mapping of vehicle types
        const dbVehicleType = vehicleType === 'car' ? 'car' : 'moto';
        query = query.eq('vehicle_type', dbVehicleType);
      }
      
      const { data, error } = await query.order('marca_modelo');

      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} vehicles for type: ${vehicleType || 'all'}`);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Selecionar Veículo</h2>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Escolha o {vehicleType === 'car' ? 'carro' : vehicleType === 'moto' ? 'moto' : 'veículo'} para a inspeção
        </p>
      </div>

      <Card className="shadow-medium mx-2 sm:mx-0">
        <CardHeader className="px-4 sm:px-6 py-4">
          <CardTitle className="text-base sm:text-lg">
            {vehicleType === 'car' ? 'Carros Cadastrados' : 
             vehicleType === 'moto' ? 'Motos Cadastradas' : 
             'Veículos Cadastrados'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 px-4 sm:px-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar veículo por modelo ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 btn-touch"
            />
          </div>

          {/* Vehicle Selection */}
          {loading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Carregando veículos...</p>
            </div>
          ) : filteredVehicles.length > 0 ? (
            <div className="space-y-3 max-h-80 sm:max-h-64 overflow-y-auto">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors btn-touch ${
                    selectedVehicleId === vehicle.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                      {vehicle.vehicle_type === "moto" ? 
                        <Bike className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> : 
                        <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center gap-2 mb-1 flex-col sm:flex-row">
                        <p className="font-medium text-sm sm:text-base truncate">{vehicle.marca_modelo}</p>
                        <Badge variant="outline" className="text-xs">{vehicle.placa}</Badge>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span>{vehicle.cor}</span>
                        <span>•</span>
                        <span>{vehicle.ano}</span>
                        <span>•</span>
                        <Badge variant={vehicle.vehicle_type === "car" ? "default" : "secondary"} className="text-xs">
                          {vehicle.vehicle_type === "car" ? "Carro" : "Moto"}
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
              <h3 className="text-lg font-medium mb-2">
                {vehicleType ? 
                  `Nenhum ${vehicleType === 'car' ? 'carro' : 'moto'} encontrado` : 
                  'Nenhum veículo encontrado'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 
                  "Tente ajustar os filtros de busca" : 
                  vehicleType ? 
                    `Cadastre um ${vehicleType === 'car' ? 'carro' : 'moto'} para continuar` :
                    "Cadastre um veículo para continuar"
                }
              </p>
              <Button onClick={() => window.location.href = '/vehicles'}>
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar Veículos
              </Button>
            </div>
          )}

          <Button 
            size="lg" 
            className="w-full mt-6 bg-gradient-primary hover:opacity-90 btn-touch"
            disabled={!selectedVehicleId}
            onClick={handleSelect}
          >
            Continuar com Veículo Selecionado
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}