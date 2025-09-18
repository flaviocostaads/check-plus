import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, User, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import VehicleListSelector from "@/components/VehicleListSelector";
import DriverSelector from "@/components/DriverSelector";

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
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

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
    // Here you would navigate to the actual inspection interface
    // For now, just show a success message
    alert("Inspeção iniciada! Esta funcionalidade será implementada em breve.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-primary" />
              Nova Inspeção
            </h1>
            <p className="text-muted-foreground">
              Inicie uma nova inspeção veicular
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="font-medium">Selecionar Veículo</span>
            </div>
            <div className="w-12 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="font-medium">Selecionar Motorista</span>
            </div>
            <div className="w-12 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
                3
              </div>
              <span className="font-medium">Iniciar Inspeção</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  Selecionar Veículo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VehicleListSelector onSelect={handleVehicleSelect} />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Selecionar Motorista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Veículo selecionado:</p>
                  <p className="font-medium">{selectedVehicle?.marca_modelo} - {selectedVehicle?.placa}</p>
                </div>
                <DriverSelector onNext={handleDriverNext} onBack={handleDriverBack} />
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Confirmar e Iniciar Inspeção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Veículo:</p>
                    <p className="font-medium">{selectedVehicle?.marca_modelo} - {selectedVehicle?.placa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Motorista:</p>
                    <p className="font-medium">{selectedDriver?.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">CPF: {selectedDriver?.cpf}</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Voltar
                  </Button>
                  <Button onClick={handleStartInspection} className="bg-gradient-primary hover:opacity-90">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Iniciar Inspeção
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}