import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DriverFormDialog from "@/components/DriverFormDialog";

interface Driver {
  id: string;
  nome_completo: string;
  cpf: string;
  cnh_numero: string;
  cnh_validade: string;
  telefone?: string;
  email?: string;
  avatar_url?: string;
  is_active: boolean;
}

interface DriverSelectorProps {
  onNext: (driverId: string, driverData: Driver) => void;
  onBack: () => void;
}

export default function DriverSelector({ onNext, onBack }: DriverSelectorProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Direct query for active drivers
      const { data, error } = await supabase
        .from('drivers')
        .select('id, nome_completo, cpf, cnh_numero, cnh_validade, telefone, avatar_url, is_active')
        .eq('is_active', true)
        .order('nome_completo');

      if (error) {
        console.error('Database error:', error);
        toast.error('Erro ao carregar motoristas');
        return;
      }
      
      // Map the data with masking for security
      const mappedDrivers = (data || []).map(driver => ({
        id: driver.id,
        nome_completo: driver.nome_completo,
        cpf: driver.cpf ? driver.cpf.substring(0, 3) + '.***.***-**' : '***.***.***-**',
        cnh_numero: driver.cnh_numero ? driver.cnh_numero.substring(0, 3) + '********' : '***********',
        cnh_validade: driver.cnh_validade,
        telefone: driver.telefone ? driver.telefone.substring(0, 2) + '*****-****' : null,
        email: '', // Not available in selector view
        avatar_url: driver.avatar_url,
        is_active: driver.is_active
      }));
      
      setDrivers(mappedDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Erro ao carregar motoristas');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverCreated = (newDriver: any) => {
    fetchDrivers();
    setSelectedDriverId(newDriver.id);
  };

  const handleNext = () => {
    const selectedDriver = drivers.find(d => d.id === selectedDriverId);
    if (selectedDriver) {
      onNext(selectedDriverId, selectedDriver);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.cpf.includes(searchTerm) ||
    driver.cnh_numero.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-surface p-4">
      <div className="mx-auto max-w-md space-y-6 pt-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Selecionar Motorista</h1>
            <p className="text-muted-foreground">Escolha o motorista para a inspeção</p>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Motoristas Cadastrados</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar motorista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Driver Selection */}
            {loading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Carregando motoristas...</p>
              </div>
            ) : filteredDrivers.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDriverId === driver.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedDriverId(driver.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={driver.avatar_url} />
                        <AvatarFallback>
                          {driver.nome_completo.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{driver.nome_completo}</p>
                        <p className="text-sm text-muted-foreground">
                          CPF: {driver.cpf} • CNH: {driver.cnh_numero}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum motorista encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Tente ajustar os filtros de busca" : "Cadastre um motorista para continuar"}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Motorista
                </Button>
              </div>
            )}

            <Button 
              variant="hero" 
              size="lg" 
              className="w-full mt-6"
              disabled={!selectedDriverId}
              onClick={handleNext}
            >
              Continuar com Motorista Selecionado
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
        
        <DriverFormDialog 
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onDriverCreated={handleDriverCreated}
        />
      </div>
    </div>
  );
}