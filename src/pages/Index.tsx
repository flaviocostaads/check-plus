import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VehicleSelector from "@/components/VehicleSelector";
import VehicleForm from "@/components/VehicleForm";
import DriverForm from "@/components/DriverForm";
import InspectionView from "@/components/InspectionView";
import AuthForm from "@/components/AuthForm";
import Dashboard from "./Dashboard";
import { VehicleType, VehicleData, DriverData, InspectionData } from "@/types/inspection";
import { useAuth } from "@/contexts/AuthContext";
import { QuickActions } from "@/components/QuickActions";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import appLogo from "@/assets/app-logo.png";

type Step = 'dashboard' | 'selector' | 'vehicle' | 'driver' | 'inspection' | 'complete';

const Index = () => {
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('dashboard');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [inspectionData, setInspectionData] = useState<InspectionData | null>(null);

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

  const handleInspectionComplete = (inspection: InspectionData) => {
    setInspectionData(inspection);
    setCurrentStep('complete');
  };

  const resetToStart = () => {
    setCurrentStep('dashboard');
    setVehicleData(null);
    setDriverData(null);
    setInspectionData(null);
  };

  const handleNewInspection = () => {
    navigate('/new-inspection');
  };

  // Show login if not authenticated
  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

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
              <div>Veículo: {inspectionData?.vehicleData.marca_modelo}</div>
              <div>Placa: {inspectionData?.vehicleData.placa}</div>
              <div>Condutor: {inspectionData?.driverData.nome_completo}</div>
              <div>Itens verificados: {inspectionData?.checklistItems.length}</div>
              <div>Avarias: {inspectionData?.damageMarkers?.length || 0}</div>
            </div>
          </div>
          <div className="space-y-2">
            <button 
              onClick={resetToStart}
              className="w-full bg-gradient-primary text-primary-foreground py-3 rounded-lg font-medium hover:scale-105 transition-transform"
            >
              Nova Inspeção
            </button>
            <button 
              onClick={() => setCurrentStep('dashboard')}
              className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors text-sm"
            >
              Voltar ao Dashboard
            </button>
            <button 
              onClick={logout}
              className="w-full bg-muted text-muted-foreground py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors text-sm"
            >
              Sair ({userProfile?.name || user?.email})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentStep === 'dashboard' && user && (
        <AuthenticatedLayout>
          <Dashboard onNewInspection={handleNewInspection} />
        </AuthenticatedLayout>
      )}
      
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
