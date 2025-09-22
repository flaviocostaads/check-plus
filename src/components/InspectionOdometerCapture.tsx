import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, ChevronRight, ChevronLeft } from "lucide-react";
import { OdometerCapture } from "@/components/OdometerCapture";

interface InspectionOdometerCaptureProps {
  onNext: (reading: string, photoUrl: string) => Promise<void>;
  onBack: () => void;
}

export default function InspectionOdometerCapture({ onNext, onBack }: InspectionOdometerCaptureProps) {
  const [reading, setReading] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOdometerCapture = (km: string, photoUrl: string) => {
    setReading(km);
    setPhotoUrl(photoUrl);
    // Automaticamente prosseguir após capturar
    handleNext(km, photoUrl);
  };

  const handleNext = async (km?: string, photo?: string) => {
    const finalReading = km || reading;
    const finalPhotoUrl = photo || photoUrl;
    
    if (!finalReading || !finalPhotoUrl) {
      return;
    }
    
    setLoading(true);
    try {
      await onNext(finalReading, finalPhotoUrl);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = reading.trim() !== "" && photoUrl !== null;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="text-center">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Registrar Quilometragem</h3>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Informe a quilometragem atual do veículo e tire uma foto do odômetro para comprovação.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm sm:text-base">Registro do Odômetro</Label>
          <div className="flex flex-col items-center gap-3">
            <OdometerCapture 
              onOdometerCapture={handleOdometerCapture}
            />
            {photoUrl && (
              <div className="text-sm text-success flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Foto e quilometragem registradas com sucesso
              </div>
            )}
          </div>
          {photoUrl && (
            <div className="mt-3">
              <img 
                src={photoUrl} 
                alt="Odômetro" 
                className="w-40 h-28 sm:w-32 sm:h-24 object-cover rounded-lg border mx-auto sm:mx-0"
              />
              <div className="text-center mt-2">
                <span className="text-sm font-medium">KM: {reading}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6">
        <Button variant="outline" onClick={onBack} className="flex-1 btn-touch">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        {isFormValid && (
          <Button 
            onClick={() => handleNext()} 
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