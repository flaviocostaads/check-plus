import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car, User, Camera, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InspectionView from "@/components/InspectionView";
import InspectionOdometerCapture from "@/components/InspectionOdometerCapture";
import { VehicleType, ChecklistItem } from "@/types/inspection";

interface Vehicle {
  id: string;
  marca_modelo: string;
  placa: string;
  vehicle_type: VehicleType;
  cor: string;
  ano: string;
  renavam: string;
  km_atual?: string;
  photo_url?: string;
}

interface Driver {
  id: string;
  nome_completo: string;
  cpf: string;
  cnh_numero: string;
  cnh_validade: string;
  telefone?: string;
  email?: string;
}

export default function InspectionInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'odometer' | 'inspection' | 'complete'>('odometer');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [odometerReading, setOdometerReading] = useState<string>("");
  const [odometerPhotoUrl, setOdometerPhotoUrl] = useState<string | null>(null);
  const [location_coords, setLocationCoords] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    // Get data from navigation state
    const { selectedVehicle, selectedDriver } = location.state || {};
    
    if (!selectedVehicle || !selectedDriver) {
      toast.error("Dados da inspeção não encontrados");
      navigate("/new-inspection");
      return;
    }

    setVehicle(selectedVehicle);
    setDriver(selectedDriver);

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Could not get location:", error);
        }
      );
    }
  }, [location.state, navigate]);

  const handleOdometerNext = async (reading: string, photoUrl: string) => {
    try {
      // Create inspection record
      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: vehicle!.id,
          driver_id: driver!.id,
          driver_name: driver!.nome_completo,
          driver_cpf: driver!.cpf,
          driver_cnh: driver!.cnh_numero,
          driver_cnh_validade: driver!.cnh_validade,
          inspector_id: (await supabase.auth.getUser()).data.user?.id,
          odometer_photo_url: photoUrl,
          latitude: location_coords?.latitude,
          longitude: location_coords?.longitude
        })
        .select()
        .single();

      if (error) throw error;

      setInspectionId(inspection.id);
      setOdometerReading(reading);
      setOdometerPhotoUrl(photoUrl);
      setCurrentStep('inspection');

      toast.success("Inspeção iniciada com sucesso!");
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast.error("Erro ao iniciar inspeção");
    }
  };

  const handleInspectionComplete = () => {
    setCurrentStep('complete');
    toast.success("Inspeção concluída com sucesso!");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (!vehicle || !driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando inspeção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/new-inspection")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-primary" />
              Inspeção Veicular
            </h1>
            <p className="text-muted-foreground">
              {currentStep === 'odometer' && "Registrar quilometragem"}
              {currentStep === 'inspection' && "Executar checklist de inspeção"}
              {currentStep === 'complete' && "Inspeção concluída"}
            </p>
          </div>
        </div>

        {/* Vehicle and Driver Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-4">
                {vehicle.photo_url && (
                  <img 
                    src={vehicle.photo_url} 
                    alt="Veículo"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{vehicle.marca_modelo}</p>
                  <p className="text-sm text-muted-foreground">Placa: {vehicle.placa}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{vehicle.cor}</Badge>
                    <Badge variant="outline">{vehicle.ano}</Badge>
                    <Badge variant="outline">
                      {vehicle.vehicle_type === 'car' ? 'Carro' : 'Moto'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>RENAVAM: {vehicle.renavam}</p>
                {vehicle.km_atual && <p>KM Atual: {vehicle.km_atual}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Motorista
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-semibold">{driver.nome_completo}</p>
                <p className="text-sm text-muted-foreground">CPF: {driver.cpf}</p>
                <p className="text-sm text-muted-foreground">CNH: {driver.cnh_numero}</p>
                <p className="text-sm text-muted-foreground">Validade: {driver.cnh_validade}</p>
                {driver.telefone && (
                  <p className="text-sm text-muted-foreground">Tel: {driver.telefone}</p>
                )}
              </div>
              {location_coords && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Localização capturada</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 'odometer' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Registro de Quilometragem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InspectionOdometerCapture
                  onNext={handleOdometerNext}
                  onBack={() => navigate("/new-inspection")}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'inspection' && inspectionId && (
            <InspectionView
              vehicleType={vehicle.vehicle_type}
              vehicleData={{
                marca_modelo: vehicle.marca_modelo,
                placa: vehicle.placa,
                cor: vehicle.cor,
                ano: vehicle.ano,
                renavam: vehicle.renavam,
                km_atual: odometerReading
              }}
              driverData={{
                nome_completo: driver.nome_completo,
                cpf: driver.cpf,
                cnh_numero: driver.cnh_numero,
                cnh_validade: driver.cnh_validade
              }}
              onNext={handleInspectionComplete}
              onBack={() => setCurrentStep('odometer')}
            />
          )}

          {currentStep === 'complete' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Inspeção Concluída
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold">Inspeção finalizada com sucesso!</h3>
                    <p className="text-muted-foreground">
                      A inspeção do veículo {vehicle.placa} foi concluída e salva no sistema.
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center mt-6">
                    <Button onClick={handleBackToDashboard}>
                      Voltar ao Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/new-inspection")}
                    >
                      Nova Inspeção
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}