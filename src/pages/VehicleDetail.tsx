import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car as CarIcon, Bike } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InspectionHistoryList from "@/components/InspectionHistoryList";
import { VehicleType } from "@/types/inspection";

interface Vehicle {
  id: string;
  marca_modelo: string;
  placa: string;
  cor: string;
  ano: string;
  renavam: string;
  km_atual?: string;
  vehicle_type: VehicleType;
  photo_url?: string;
  cidade?: string;
  estado?: string;
  created_at: string;
}

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVehicle(data);
    } catch (error) {
      console.error("Erro ao buscar veículo:", error);
      toast.error("Erro ao carregar dados do veículo");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Veículo não encontrado</p>
            <Button onClick={() => navigate('/vehicle-management')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/vehicle-management')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Gerenciamento de Veículos
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Informações do Veículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                {vehicle.photo_url ? (
                  <img
                    src={vehicle.photo_url}
                    alt={vehicle.marca_modelo}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
                    {vehicle.vehicle_type === 'car' ? (
                      <CarIcon className="h-16 w-16 text-muted-foreground" />
                    ) : (
                      <Bike className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                )}
                <h2 className="text-2xl font-bold">{vehicle.marca_modelo}</h2>
                <div className="text-xl font-semibold text-primary mt-1">{vehicle.placa}</div>
                <Badge variant={vehicle.vehicle_type === 'car' ? 'default' : 'secondary'} className="mt-2">
                  {vehicle.vehicle_type === 'car' ? (
                    <><CarIcon className="h-3 w-3 mr-1" /> Carro</>
                  ) : (
                    <><Bike className="h-3 w-3 mr-1" /> Moto</>
                  )}
                </Badge>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Cor</div>
                    <div className="font-medium">{vehicle.cor}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Ano</div>
                    <div className="font-medium">{vehicle.ano}</div>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="text-muted-foreground">RENAVAM</div>
                  <div className="font-medium">{vehicle.renavam}</div>
                </div>

                {vehicle.km_atual && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">KM Atual</div>
                    <div className="font-medium">{vehicle.km_atual} km</div>
                  </div>
                )}

                {vehicle.cidade && vehicle.estado && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">Localização</div>
                    <div className="font-medium">{vehicle.cidade}/{vehicle.estado}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <InspectionHistoryList filterId={id} filterType="vehicle" />
          </div>
        </div>
      </div>
    </div>
  );
}
