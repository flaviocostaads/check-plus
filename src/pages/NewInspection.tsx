import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, User, CheckCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import VehicleListSelector from "@/components/VehicleListSelector";
import DriverSelector from "@/components/DriverSelector";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";

interface Vehicle {
  id: string;
  marca_modelo: string;
  placa: string;
  vehicle_type: string;
  cor: string;
  ano: string;
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

export default function NewInspection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [vehicleType, setVehicleType] = useState<'car' | 'moto' | undefined>();

  useEffect(() => {
    // Get vehicle type from navigation state
    if (location.state?.vehicleType) {
      setVehicleType(location.state.vehicleType);
    }
  }, [location.state]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setStep(2);
  };

  const handleDriverNext = (driverId: string, driverData: Driver) => {
    setSelectedDriver(driverData);
    setStep(3);
  };

  const handleDriverBack = () => {
    setStep(1);
  };

  const handleStartInspection = () => {
    // Navigate to inspection interface with selected data
    navigate("/inspection", {
      state: {
        selectedVehicle: selectedVehicle,
        selectedDriver: selectedDriver
      }
    });
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="btn-touch">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Voltar ao Dashboard</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Nova Inspeção
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {vehicleType === 'car' ? 'Inspeção de Carro' : 
               vehicleType === 'moto' ? 'Inspeção de Moto' : 
               'Inicie uma nova inspeção veicular'}
            </p>
          </div>
        </div>

        {/* Progress Steps - Mobile optimized */}
        <div className="mb-6 sm:mb-8 bg-card/50 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between space-x-2 sm:space-x-4">
            <div className={`flex flex-col items-center space-y-1 flex-1 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium ${step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">Veículo</span>
            </div>
            <div className="w-8 sm:w-16 h-px bg-border mt-[-1rem]"></div>
            <div className={`flex flex-col items-center space-y-1 flex-1 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium ${step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">Motorista</span>
            </div>
            <div className="w-8 sm:w-16 h-px bg-border mt-[-1rem]"></div>
            <div className={`flex flex-col items-center space-y-1 flex-1 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium ${step >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">Confirmar</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <Card className="mx-2 sm:mx-0">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Selecionar {vehicleType === 'car' ? 'Carro' : vehicleType === 'moto' ? 'Moto' : 'Veículo'}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <VehicleListSelector onSelect={handleVehicleSelect} vehicleType={vehicleType} />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="mx-2 sm:mx-0">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Selecionar Motorista
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="mb-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground">Veículo selecionado:</p>
                  <p className="font-medium text-sm sm:text-base">{selectedVehicle?.marca_modelo} - {selectedVehicle?.placa}</p>
                </div>
                <DriverSelector onNext={handleDriverNext} onBack={handleDriverBack} />
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="mx-2 sm:mx-0">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Confirmar e Iniciar Inspeção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-6">
                <div className="p-3 sm:p-4 bg-muted/30 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Veículo:</p>
                    <p className="font-medium text-sm sm:text-base">{selectedVehicle?.marca_modelo} - {selectedVehicle?.placa}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Motorista:</p>
                    <p className="font-medium text-sm sm:text-base">{selectedDriver?.nome_completo}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">CPF: {selectedDriver?.cpf}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 btn-touch">
                    Voltar
                  </Button>
                  <Button onClick={handleStartInspection} className="flex-1 bg-gradient-primary hover:opacity-90 btn-touch">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Iniciar Inspeção</span>
                    <span className="sm:hidden">Iniciar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}