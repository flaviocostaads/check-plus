import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ChecklistItemComponent from "./ChecklistItemComponent";
import DamageMarker from "./DamageMarker";
import SignatureCapture from "./SignatureCapture";
import ReportGenerator from "./ReportGenerator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  VehicleType, 
  ChecklistItem, 
  CAR_CHECKLIST_ITEMS, 
  MOTO_CHECKLIST_ITEMS, 
  VehicleData, 
  DriverData,
  InspectionData,
  DamageMarker as DamageMarkerType
} from "@/types/inspection";
import { ChevronRight, ClipboardCheck, Car, Bike, User, FileText, ArrowLeft, ArrowRight, CheckCircle, MapPin, PenTool } from "lucide-react";

interface InspectionViewProps {
  vehicleType: VehicleType;
  vehicleData: VehicleData;
  driverData: DriverData;
  inspectionId?: string;
  onNext: (inspection: InspectionData) => void;
  onBack: () => void;
}

export default function InspectionView({ 
  vehicleType, 
  vehicleData, 
  driverData, 
  inspectionId,
  onNext, 
  onBack 
}: InspectionViewProps) {
  const [currentStep, setCurrentStep] = useState<'checklist' | 'damages' | 'signature' | 'report'>('checklist');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [damageMarkers, setDamageMarkers] = useState<DamageMarkerType[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  
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

  const addDamageMarker = (damage: Omit<DamageMarkerType, 'id'>) => {
    const newDamage: DamageMarkerType = {
      ...damage,
      id: `damage-${Date.now()}`
    };
    setDamageMarkers(prev => [...prev, newDamage]);
  };

  const updateDamageMarker = (updatedDamage: DamageMarkerType) => {
    setDamageMarkers(prev => 
      prev.map(damage => damage.id === updatedDamage.id ? updatedDamage : damage)
    );
  };

  const completedItems = checklistItems.filter(item => item.status).length;
  const totalItems = checklistItems.length;
  const progress = (completedItems / totalItems) * 100;

  const okCount = checklistItems.filter(item => item.status === 'ok').length;
  const needsReplacementCount = checklistItems.filter(item => item.status === 'needs_replacement').length;
  const observationCount = checklistItems.filter(item => item.status === 'observation').length;

  const canProceed = completedItems === totalItems;

  const handleStepNext = async () => {
    if (currentStep === 'checklist') {
      if (!canProceed) return;
      setCurrentStep('damages');
    } else if (currentStep === 'damages') {
      setCurrentStep('signature');
    } else if (currentStep === 'signature') {
      if (!signature) return;
      setCurrentStep('report');
    } else if (currentStep === 'report') {
      try {
        if (inspectionId) {
          // Save checklist items to database
          const { data: templates } = await supabase
            .from('checklist_templates')
            .select('*')
            .eq('vehicle_type', vehicleType)
            .eq('is_active', true);

          if (templates) {
            // Save inspection items
            const inspectionItemsToSave = checklistItems
              .filter(item => item.status)
              .map(item => {
                const template = templates.find(t => t.name === item.name);
                return {
                  inspection_id: inspectionId,
                  checklist_template_id: template?.id,
                  status: item.status,
                  observations: item.observations || null
                };
              })
              .filter(item => item.checklist_template_id);

            if (inspectionItemsToSave.length > 0) {
              const { error: itemsError } = await supabase
                .from('inspection_items')
                .insert(inspectionItemsToSave);

              if (itemsError) {
                console.error('Error saving inspection items:', itemsError);
                toast.error('Erro ao salvar itens da inspeção');
                return;
              }

              // Save inspection photos if any
              for (const item of checklistItems) {
                if (item.photos && item.photos.length > 0) {
                  const template = templates.find(t => t.name === item.name);
                  if (template) {
                    const { data: savedItem } = await supabase
                      .from('inspection_items')
                      .select('id')
                      .eq('inspection_id', inspectionId)
                      .eq('checklist_template_id', template.id)
                      .single();

                    if (savedItem) {
                      const photosToSave = item.photos.map(photo => ({
                        inspection_item_id: savedItem.id,
                        photo_url: photo
                      }));

                      await supabase
                        .from('inspection_photos')
                        .insert(photosToSave);
                    }
                  }
                }
              }
            }

            // Save damage markers if any
            if (damageMarkers.length > 0) {
              const damageMarkersToSave = damageMarkers.map(damage => ({
                inspection_id: inspectionId,
                description: damage.description,
                x_position: damage.x,
                y_position: damage.y
              }));

              const { data: savedDamages, error: damageError } = await supabase
                .from('damage_markers')
                .insert(damageMarkersToSave)
                .select();

              if (damageError) {
                console.error('Error saving damage markers:', damageError);
              } else if (savedDamages) {
                // Save damage photos
                for (let i = 0; i < damageMarkers.length; i++) {
                  const damage = damageMarkers[i];
                  const savedDamage = savedDamages[i];
                  
                  if (damage.photos && damage.photos.length > 0) {
                    const photosToSave = damage.photos.map(photo => ({
                      damage_marker_id: savedDamage.id,
                      photo_url: photo
                    }));

                    await supabase
                      .from('damage_marker_photos')
                      .insert(photosToSave);
                  }
                }
              }
            }

            // Update inspection with signature
            if (signature) {
              await supabase
                .from('inspections')
                .update({ signature_data: signature })
                .eq('id', inspectionId);
            }
          }
        }

        const inspection: InspectionData = {
          id: inspectionId || `insp-${Date.now()}`,
          vehicleType,
          vehicleData,
          driverData,
          checklistItems,
          damageMarkers,
          signature,
          createdAt: new Date()
        };
        
        onNext(inspection);
      } catch (error) {
        console.error('Error saving inspection:', error);
        toast.error('Erro ao salvar inspeção');
      }
    }
  };

  const handleStepBack = () => {
    if (currentStep === 'checklist') {
      onBack();
    } else if (currentStep === 'damages') {
      setCurrentStep('checklist');
    } else if (currentStep === 'signature') {
      setCurrentStep('damages');
    } else if (currentStep === 'report') {
      setCurrentStep('signature');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'checklist': return `Inspeção ${vehicleType === 'car' ? 'Carro' : 'Moto'}`;
      case 'damages': return 'Registro de Avarias';
      case 'signature': return 'Assinatura';
      case 'report': return 'Finalizar Relatório';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'checklist': return vehicleType === 'car' ? <Car className="w-5 h-5 text-primary" /> : <Bike className="w-5 h-5 text-primary" />;
      case 'damages': return <MapPin className="w-5 h-5 text-primary" />;
      case 'signature': return <PenTool className="w-5 h-5 text-primary" />;
      case 'report': return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card shadow-medium border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={handleStepBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                {getStepIcon()}
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    {getStepTitle()}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {vehicleData.marca_modelo} • {vehicleData.placa}
                  </p>
                </div>
              </div>
            </div>
            
            {currentStep === 'checklist' && (
              <Badge variant="secondary" className="text-xs">
                {completedItems}/{totalItems}
              </Badge>
            )}
          </div>

          {/* Progress - only for checklist */}
          {currentStep === 'checklist' && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Vehicle and driver info cards - show in checklist step */}
        {currentStep === 'checklist' && (
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
        )}

        {/* Step Content */}
        {currentStep === 'checklist' && (
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
        )}

        {currentStep === 'damages' && (
          <DamageMarker
            vehicleType={vehicleType}
            damages={damageMarkers}
            onDamageAdd={addDamageMarker}
            onDamageUpdate={updateDamageMarker}
          />
        )}

        {currentStep === 'signature' && (
          <SignatureCapture
            driverName={driverData.nome_completo}
            onSignatureCapture={setSignature}
          />
        )}

        {currentStep === 'report' && signature && (
          <ReportGenerator
            inspection={{
              id: `insp-${Date.now()}`,
              vehicleType,
              vehicleData,
              driverData,
              checklistItems,
              damageMarkers,
              signature,
              createdAt: new Date()
            }}
          />
        )}
      </div>

      {/* Bottom action */}
      <div className="sticky bottom-0 bg-card border-t shadow-strong p-4">
        <Button 
          variant="hero" 
          size="lg" 
          className="w-full"
          disabled={
            (currentStep === 'checklist' && !canProceed) ||
            (currentStep === 'signature' && !signature)
          }
          onClick={handleStepNext}
        >
          {currentStep === 'report' ? <CheckCircle className="w-5 h-5 mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
          {currentStep === 'checklist' && !canProceed && `Faltam ${totalItems - completedItems} itens`}
          {currentStep === 'checklist' && canProceed && 'Próximo: Avarias'}
          {currentStep === 'damages' && 'Próximo: Assinatura'}
          {currentStep === 'signature' && !signature && 'Aguardando assinatura'}
          {currentStep === 'signature' && signature && 'Próximo: Relatório'}
          {currentStep === 'report' && 'Finalizar Inspeção'}
        </Button>
      </div>
    </div>
  );
}