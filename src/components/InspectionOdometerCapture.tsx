import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, Gauge } from "lucide-react";

interface InspectionOdometerCaptureProps {
  onNext: (reading: string, photoUrl: string) => Promise<void>;
  onBack: () => void;
}

export default function InspectionOdometerCapture({ onNext, onBack }: InspectionOdometerCaptureProps) {
  const [reading, setReading] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!reading.trim()) {
      return;
    }
    
    setLoading(true);
    try {
      // Usando uma URL placeholder para a foto (temporariamente removida)
      await onNext(reading, "placeholder-photo-url");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = reading.trim() !== "";

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="text-center">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Registrar Quilometragem</h3>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Informe a quilometragem atual do veículo.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="odometer" className="text-sm sm:text-base">Quilometragem Atual (KM)</Label>
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-sm">
              <Input
                id="odometer"
                type="number"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="Ex: 123456"
                className="h-12 btn-touch text-base text-center"
              />
            </div>
            {reading && (
              <div className="text-sm text-success flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Quilometragem informada: {reading} KM
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6">
        <Button variant="outline" onClick={onBack} className="flex-1 btn-touch">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        {isFormValid && (
          <Button 
            onClick={handleNext} 
            disabled={loading}
            className="flex-1 bg-gradient-primary hover:opacity-90 btn-touch"
          >
            {loading ? "Salvando..." : "Continuar"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}