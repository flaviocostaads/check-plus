import { useState } from "react";
import VehicleSelector from "@/components/VehicleSelector";
import VehicleForm from "@/components/VehicleForm";
import DriverForm from "@/components/DriverForm";
import InspectionView from "@/components/InspectionView";
import { VehicleType, VehicleData, DriverData, ChecklistItem } from "@/types/inspection";
import appLogo from "@/assets/app-logo.png";
import heroBackground from "@/assets/hero-bg.jpg";

type Step = 'selector' | 'vehicle' | 'driver' | 'inspection' | 'complete';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('selector');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const handleVehicleSelect = (type: VehicleType) => {
    setVehicleType(type);
    setCurrentStep('vehicle');
  };

  const handleVehicleSubmit = (data: VehicleData) => {
    setVehicleData(data);
    setCurrentStep('driver');
  };

  const handleDriverSubmit = (data: DriverData) => {
    setDriverData(data);
    setCurrentStep('inspection');
  };

  const handleInspectionComplete = (items: ChecklistItem[]) => {
    setChecklistItems(items);
    setCurrentStep('complete');
  };

  const resetToStart = () => {
    setCurrentStep('selector');
    setVehicleData(null);
    setDriverData(null);
    setChecklistItems([]);
  };

  // Completion screen
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-surface p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-success/10 rounded-full flex items-center justify-center">
            <img src={appLogo} alt="NSA Checklist" className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Inspeção Concluída!</h1>
            <p className="text-muted-foreground">
              A inspeção foi finalizada com sucesso. O relatório será gerado em breve.
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-soft">
            <h3 className="font-semibold mb-2">Resumo:</h3>
            <div className="text-sm space-y-1">
              <div>Veículo: {vehicleData?.marca_modelo}</div>
              <div>Placa: {vehicleData?.placa}</div>
              <div>Condutor: {driverData?.nome_completo}</div>
              <div>Itens verificados: {checklistItems.length}</div>
            </div>
          </div>
          <button 
            onClick={resetToStart}
            className="w-full bg-gradient-primary text-primary-foreground py-3 rounded-lg font-medium hover:scale-105 transition-transform"
          >
            Nova Inspeção
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentStep === 'selector' && (
        <VehicleSelector onSelectVehicle={handleVehicleSelect} />
      )}
      
      {currentStep === 'vehicle' && (
        <VehicleForm
          onNext={handleVehicleSubmit}
          onBack={() => setCurrentStep('selector')}
        />
      )}
      
      {currentStep === 'driver' && (
        <DriverForm
          onNext={handleDriverSubmit}
          onBack={() => setCurrentStep('vehicle')}
        />
      )}
      
      {currentStep === 'inspection' && vehicleData && driverData && (
        <InspectionView
          vehicleType={vehicleType}
          vehicleData={vehicleData}
          driverData={driverData}
          onNext={handleInspectionComplete}
          onBack={() => setCurrentStep('driver')}
        />
      )}
    </>
  );
};

export default Index;
