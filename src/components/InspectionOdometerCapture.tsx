import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  };

  const handleNext = async () => {
    if (!reading || !photoUrl) {
      return;
    }
    
    setLoading(true);
    try {
      await onNext(reading, photoUrl);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = reading.trim() !== "" && photoUrl !== null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Registrar Quilometragem</h3>
        <p className="text-muted-foreground">
          Informe a quilometragem atual do veículo e tire uma foto do odômetro para comprovação.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reading">Quilometragem Atual (KM)</Label>
          <Input
            id="reading"
            type="number"
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            placeholder="Ex: 123456"
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label>Foto do Odômetro</Label>
          <div className="flex items-center gap-4">
            <OdometerCapture 
              onOdometerCapture={handleOdometerCapture}
              initialKm={reading}
            />
            {photoUrl && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Foto capturada
              </div>
            )}
          </div>
          {photoUrl && (
            <div className="mt-2">
              <img 
                src={photoUrl} 
                alt="Odômetro" 
                className="w-32 h-24 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!isFormValid || loading}
          className="flex-1"
        >
          {loading ? "Salvando..." : "Continuar"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}