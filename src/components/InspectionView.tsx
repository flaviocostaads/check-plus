import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ChecklistItemComponent from "./ChecklistItemComponent";
import { 
  VehicleType, 
  ChecklistItem, 
  CAR_CHECKLIST_ITEMS, 
  MOTO_CHECKLIST_ITEMS, 
  VehicleData, 
  DriverData 
} from "@/types/inspection";
import { ChevronRight, ClipboardCheck, Car, Bike, User, FileText } from "lucide-react";

interface InspectionViewProps {
  vehicleType: VehicleType;
  vehicleData: VehicleData;
  driverData: DriverData;
  onNext: (checklistItems: ChecklistItem[]) => void;
  onBack: () => void;
}

export default function InspectionView({ 
  vehicleType, 
  vehicleData, 
  driverData, 
  onNext, 
  onBack 
}: InspectionViewProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  
  useEffect(() => {
    const baseItems = vehicleType === 'car' ? CAR_CHECKLIST_ITEMS : MOTO_CHECKLIST_ITEMS;
    const items: ChecklistItem[] = baseItems.map(item => ({
      ...item,
      status: undefined,
      observations: '',
      photos: []
    }));
    setChecklistItems(items);
  }, [vehicleType]);

  const handleItemUpdate = (updatedItem: ChecklistItem) => {
    setChecklistItems(prev => 
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  };

  const completedItems = checklistItems.filter(item => item.status).length;
  const totalItems = checklistItems.length;
  const progress = (completedItems / totalItems) * 100;

  const okCount = checklistItems.filter(item => item.status === 'ok').length;
  const needsReplacementCount = checklistItems.filter(item => item.status === 'needs_replacement').length;
  const observationCount = checklistItems.filter(item => item.status === 'observation').length;

  const canProceed = completedItems === totalItems;

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card shadow-medium border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <div className="flex items-center space-x-2">
                {vehicleType === 'car' ? (
                  <Car className="w-5 h-5 text-primary" />
                ) : (
                  <Bike className="w-5 h-5 text-primary" />
                )}
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    Inspeção {vehicleType === 'car' ? 'Carro' : 'Moto'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {vehicleData.marca_modelo} • {vehicleData.placa}
                  </p>
                </div>
              </div>
            </div>
            
            <Badge variant="secondary" className="text-xs">
              {completedItems}/{totalItems}
            </Badge>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso da inspeção</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Status summary */}
          <div className="flex space-x-4 mt-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-xs text-muted-foreground">{okCount} OK</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-xs text-muted-foreground">{needsReplacementCount} Trocar</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-xs text-muted-foreground">{observationCount} Observar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Vehicle and driver info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Car className="w-4 h-4 mr-2" />
                Dados do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1 text-sm">
              <div><span className="text-muted-foreground">Modelo:</span> {vehicleData.marca_modelo}</div>
              <div><span className="text-muted-foreground">Placa:</span> {vehicleData.placa}</div>
              <div><span className="text-muted-foreground">KM:</span> {vehicleData.km_atual}</div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <User className="w-4 h-4 mr-2" />
                Dados do Condutor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> {driverData.nome_completo}</div>
              <div><span className="text-muted-foreground">CNH:</span> {driverData.cnh_numero}</div>
            </CardContent>
          </Card>
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <ClipboardCheck className="w-5 h-5 mr-2" />
            Itens de Verificação
          </h2>
          
          {checklistItems.map((item) => (
            <ChecklistItemComponent
              key={item.id}
              item={item}
              onUpdate={handleItemUpdate}
            />
          ))}
        </div>
      </div>

      {/* Bottom action */}
      <div className="sticky bottom-0 bg-card border-t shadow-strong p-4">
        <Button 
          variant="hero" 
          size="lg" 
          className="w-full"
          disabled={!canProceed}
          onClick={() => onNext(checklistItems)}
        >
          <FileText className="w-5 h-5 mr-2" />
          {canProceed ? 'Finalizar Inspeção' : `Faltam ${totalItems - completedItems} itens`}
        </Button>
      </div>
    </div>
  );
}