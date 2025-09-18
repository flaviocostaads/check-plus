import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VehicleData } from "@/types/inspection";
import { ChevronRight } from "lucide-react";

interface VehicleFormProps {
  onNext: (data: VehicleData) => void;
  onBack: () => void;
  initialData?: Partial<VehicleData>;
}

export default function VehicleForm({ onNext, onBack, initialData }: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleData>({
    marca_modelo: initialData?.marca_modelo || '',
    placa: initialData?.placa || '',
    cor: initialData?.cor || '',
    ano: initialData?.ano || '',
    renavam: initialData?.renavam || '',
    km_atual: initialData?.km_atual || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const handleChange = (field: keyof VehicleData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = Object.values(formData).every(value => value.trim() !== '');

  return (
    <div className="min-h-screen bg-gradient-surface p-4">
      <div className="mx-auto max-w-md space-y-6 pt-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dados do Veículo</h1>
            <p className="text-muted-foreground">Preencha as informações do veículo</p>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Informações do Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="marca_modelo">Marca/Modelo *</Label>
                <Input
                  id="marca_modelo"
                  value={formData.marca_modelo}
                  onChange={(e) => handleChange('marca_modelo', e.target.value)}
                  placeholder="Ex: Toyota Corolla"
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placa">Placa *</Label>
                <Input
                  id="placa"
                  value={formData.placa}
                  onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
                  placeholder="Ex: ABC-1234"
                  className="h-12"
                  maxLength={8}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cor">Cor *</Label>
                  <Input
                    id="cor"
                    value={formData.cor}
                    onChange={(e) => handleChange('cor', e.target.value)}
                    placeholder="Ex: Branco"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ano">Ano *</Label>
                  <Input
                    id="ano"
                    value={formData.ano}
                    onChange={(e) => handleChange('ano', e.target.value)}
                    placeholder="Ex: 2020"
                    className="h-12"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renavam">Renavam *</Label>
                <Input
                  id="renavam"
                  value={formData.renavam}
                  onChange={(e) => handleChange('renavam', e.target.value)}
                  placeholder="Ex: 12345678901"
                  className="h-12"
                  maxLength={11}
                  pattern="[0-9]{11}"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="km_atual">KM Atual *</Label>
                <Input
                  id="km_atual"
                  value={formData.km_atual}
                  onChange={(e) => handleChange('km_atual', e.target.value)}
                  placeholder="Ex: 45000"
                  className="h-12"
                  type="number"
                  required
                />
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full mt-6"
                disabled={!isFormValid}
              >
                Continuar
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}