import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Bike } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VehicleSelectorProps {
  onSelectVehicle?: (type: 'car' | 'moto') => void;
}

export default function VehicleSelector({ onSelectVehicle }: VehicleSelectorProps) {
  const navigate = useNavigate();
  
  const handleVehicleSelect = (type: 'car' | 'moto') => {
    if (onSelectVehicle) {
      onSelectVehicle(type);
    } else {
      // Navigate to new inspection with vehicle type
      navigate('/new-inspection', { state: { vehicleType: type } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface p-4 sm:p-6">
      <div className="mx-auto max-w-sm sm:max-w-md space-y-4 sm:space-y-6 pt-4 sm:pt-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">NSA Checklist</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Selecione o tipo de veículo para inspeção
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Card className="shadow-medium hover:shadow-strong transition-all duration-300 cursor-pointer" 
                onClick={() => handleVehicleSelect('car')}>
            <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Car className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Carro</CardTitle>
              <CardDescription className="text-sm px-2">
                Inspeção completa para veículos de passeio
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Button 
                size="lg" 
                className="w-full bg-gradient-primary hover:opacity-90 btn-touch text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVehicleSelect('car');
                }}
              >
                Iniciar Inspeção de Carro
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-medium hover:shadow-strong transition-all duration-300 cursor-pointer"
                onClick={() => handleVehicleSelect('moto')}>
            <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Bike className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Moto</CardTitle>
              <CardDescription className="text-sm px-2">
                Inspeção específica para motocicletas
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Button 
                size="lg" 
                className="w-full bg-gradient-primary hover:opacity-90 btn-touch text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVehicleSelect('moto');
                }}
              >
                Iniciar Inspeção de Moto
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}