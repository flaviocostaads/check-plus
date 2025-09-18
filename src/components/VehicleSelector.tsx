import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Bike } from "lucide-react";

interface VehicleSelectorProps {
  onSelectVehicle: (type: 'car' | 'moto') => void;
}

export default function VehicleSelector({ onSelectVehicle }: VehicleSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-surface p-4">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">NSA Checklist</h1>
          <p className="text-muted-foreground">Selecione o tipo de veículo para inspeção</p>
        </div>

        <div className="space-y-4">
          <Card className="shadow-medium hover:shadow-strong transition-all duration-300 cursor-pointer" 
                onClick={() => onSelectVehicle('car')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Carro</CardTitle>
              <CardDescription>Inspeção completa para veículos de passeio</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVehicle('car');
                }}
              >
                Iniciar Inspeção de Carro
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-medium hover:shadow-strong transition-all duration-300 cursor-pointer"
                onClick={() => onSelectVehicle('moto')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bike className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Moto</CardTitle>
              <CardDescription>Inspeção específica para motocicletas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVehicle('moto');
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