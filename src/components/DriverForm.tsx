import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DriverData } from "@/types/inspection";
import { ChevronRight } from "lucide-react";

interface DriverFormProps {
  onNext: (data: DriverData) => void;
  onBack: () => void;
  initialData?: Partial<DriverData>;
}

export default function DriverForm({ onNext, onBack, initialData }: DriverFormProps) {
  const [formData, setFormData] = useState<DriverData>({
    nome_completo: initialData?.nome_completo || '',
    cpf: initialData?.cpf || '',
    cnh_numero: initialData?.cnh_numero || '',
    cnh_validade: initialData?.cnh_validade || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const handleChange = (field: keyof DriverData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNH = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers;
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
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
            <h1 className="text-2xl font-bold text-foreground">Dados do Condutor</h1>
            <p className="text-muted-foreground">Preencha as informações do condutor</p>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Informações do Condutor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => handleChange('nome_completo', e.target.value)}
                  placeholder="Nome completo do condutor"
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => {
                    const formatted = formatCPF(e.target.value);
                    if (formatted.length <= 14) {
                      handleChange('cpf', formatted);
                    }
                  }}
                  placeholder="000.000.000-00"
                  className="h-12"
                  maxLength={14}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnh_numero">CNH Número *</Label>
                <Input
                  id="cnh_numero"
                  value={formData.cnh_numero}
                  onChange={(e) => {
                    const formatted = formatCNH(e.target.value);
                    if (formatted.length <= 11) {
                      handleChange('cnh_numero', formatted);
                    }
                  }}
                  placeholder="12345678901"
                  className="h-12"
                  maxLength={11}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnh_validade">Validade CNH *</Label>
                <Input
                  id="cnh_validade"
                  value={formData.cnh_validade}
                  onChange={(e) => {
                    const formatted = formatDate(e.target.value);
                    if (formatted.length <= 10) {
                      handleChange('cnh_validade', formatted);
                    }
                  }}
                  placeholder="DD/MM/AAAA"
                  className="h-12"
                  maxLength={10}
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
                Iniciar Inspeção
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}