import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Camera, MapPin, Plus } from "lucide-react";
import { DamageMarker as DamageMarkerType } from "@/types/inspection";
import CameraCapture from "./CameraCapture";
import carDrawing from "@/assets/car-drawing.svg";
import motorcycleDrawing from "@/assets/motorcycle-drawing.svg";

interface DamageMarkerProps {
  vehicleType: 'car' | 'moto';
  damages: DamageMarkerType[];
  onDamageAdd: (damage: Omit<DamageMarkerType, 'id'>) => void;
  onDamageUpdate: (damage: DamageMarkerType) => void;
}

export default function DamageMarker({ vehicleType, damages, onDamageAdd, onDamageUpdate }: DamageMarkerProps) {
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState<DamageMarkerType | null>(null);

  const handleVehicleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMarkingMode) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newDamage: Omit<DamageMarkerType, 'id'> = {
      x,
      y,
      description: '',
      photos: []
    };

    onDamageAdd(newDamage);
    setIsMarkingMode(false);
  };

  const handleDamageUpdate = (damageId: string, field: 'description' | 'photos', value: string | string[]) => {
    const damage = damages.find(d => d.id === damageId);
    if (!damage) return;

    const updatedDamage = {
      ...damage,
      [field]: field === 'photos' ? [...(damage.photos || []), value as string] : value
    };

    onDamageUpdate(updatedDamage);
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Registro de Avarias
          </div>
          <Badge variant="secondary">
            {damages.length} avaria{damages.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setIsMarkingMode(!isMarkingMode)}
            variant={isMarkingMode ? "destructive" : "outline"}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isMarkingMode ? 'Cancelar' : 'Marcar Avaria'}
          </Button>
        </div>

        {isMarkingMode && (
          <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
            <p className="text-sm text-warning-foreground">
              Toque no veículo onde está a avaria
            </p>
          </div>
        )}

        <div 
          className="relative bg-muted rounded-lg p-8 cursor-crosshair min-h-[300px] flex items-center justify-center"
          onClick={handleVehicleClick}
        >
          {vehicleType === 'car' ? (
            <img 
              src={carDrawing} 
              alt="Desenho do carro" 
              className="w-80 h-48 text-foreground"
              style={{ filter: 'brightness(0) saturate(100%)' }}
            />
          ) : (
            <img 
              src={motorcycleDrawing} 
              alt="Desenho da moto" 
              className="w-80 h-48 text-foreground" 
              style={{ filter: 'brightness(0) saturate(100%)' }}
            />
          )}

          {damages.map((damage) => (
            <button
              key={damage.id}
              className="absolute w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
              style={{ left: `${damage.x}%`, top: `${damage.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDamage(damage);
              }}
            >
              <AlertTriangle className="w-3 h-3" />
            </button>
          ))}
        </div>

        {selectedDamage && (
          <Card className="border-destructive/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Detalhes da Avaria</h4>
                <div className="flex items-center gap-2">
                  <CameraCapture
                    itemName="Avaria"
                    onPhotoCapture={(photo) => handleDamageUpdate(selectedDamage.id, 'photos', photo)}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedDamage(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <Textarea
                placeholder="Descreva a avaria encontrada..."
                value={selectedDamage.description}
                onChange={(e) => handleDamageUpdate(selectedDamage.id, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              
              {selectedDamage.photos && selectedDamage.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedDamage.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Avaria ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}