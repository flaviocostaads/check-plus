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
      // Use the secure function to get driver data based on user role
      const { data, error } = await supabase.rpc('get_drivers_basic_info');

      if (error) {
        console.error('Database error:', error);
        toast.error('Erro ao carregar motoristas');
        return;
      }
      
      // Map the data for the component
      const mappedDrivers = (data || []).map(driver => ({
        id: driver.id,
        nome_completo: driver.nome_completo,
        cpf: '***.***.***-**', // Hide for security
        cnh_numero: '***********', // Hide for security
        cnh_validade: new Date().toISOString().split('T')[0], // Use current date as placeholder
        telefone: null,
        email: '',
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Selecionar Motorista</h3>
          <p className="text-sm text-muted-foreground">Escolha o motorista para a inspeção</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo
        </Button>
      </div>

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
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando motoristas...</p>
        </div>
      ) : filteredDrivers.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all btn-touch ${
                selectedDriverId === driver.id
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
              onClick={() => setSelectedDriverId(driver.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={driver.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {driver.nome_completo.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-base">{driver.nome_completo}</p>
                  <p className="text-sm text-muted-foreground">
                    Motorista cadastrado
                  </p>
                </div>
                {selectedDriverId === driver.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum motorista encontrado</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? "Tente ajustar os filtros de busca" : "Cadastre um motorista para continuar"}
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="btn-touch">
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Motorista
          </Button>
        </div>
      )}

      <Button 
        size="lg" 
        className="w-full bg-gradient-primary hover:opacity-90 btn-touch"
        disabled={!selectedDriverId}
        onClick={handleNext}
      >
        Continuar com Motorista Selecionado
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
      
      <DriverFormDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onDriverCreated={handleDriverCreated}
      />
    </div>
  );
}