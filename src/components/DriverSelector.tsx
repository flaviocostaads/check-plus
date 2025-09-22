import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    cnh_numero: "",
    cnh_validade: "",
    telefone: "",
    email: ""
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('is_active', true)
        .order('nome_completo');

      if (error) {
        if (error.code === 'PGRST301') {
          toast.error("Você não tem permissão para acessar os dados de motoristas. Entre em contato com um administrador.");
          return;
        }
        throw error;
      }
      
      setDrivers(data || []);
      
      // Log access to sensitive driver data
      if (data && data.length > 0) {
        try {
          await supabase.rpc('log_sensitive_access', {
            table_name: 'drivers',
            record_id: null,
            access_type: 'bulk_view'
          });
        } catch (logError) {
          console.error('Error logging access:', logError);
        }
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error("Erro ao carregar motoristas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('drivers')
        .insert([formData])
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST301') {
          toast.error("Você não tem permissão para criar motoristas. Entre em contato com um administrador.");
          return;
        }
        throw error;
      }
      
      toast.success("Motorista cadastrado com sucesso!");
      setIsAddDialogOpen(false);
      resetForm();
      fetchDrivers();
      
      // Auto-select the new driver
      setSelectedDriverId(data.id);
    } catch (error) {
      console.error('Error creating driver:', error);
      toast.error("Erro ao cadastrar motorista");
    }
  };

  const handleNext = () => {
    const selectedDriver = drivers.find(d => d.id === selectedDriverId);
    if (selectedDriver) {
      onNext(selectedDriverId, selectedDriver);
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      cpf: "",
      cnh_numero: "",
      cnh_validade: "",
      telefone: "",
      email: ""
    });
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
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
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Motorista</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_completo">Nome Completo *</Label>
                      <Input
                        id="nome_completo"
                        value={formData.nome_completo}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
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
                            setFormData(prev => ({ ...prev, cpf: formatted }));
                          }
                        }}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cnh_numero">CNH Número *</Label>
                      <Input
                        id="cnh_numero"
                        value={formData.cnh_numero}
                        onChange={(e) => setFormData(prev => ({ ...prev, cnh_numero: e.target.value }))}
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
                            setFormData(prev => ({ ...prev, cnh_validade: formatted }));
                          }
                        }}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        Cadastrar
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          resetForm();
                          setIsAddDialogOpen(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
      </div>
    </div>
  );
}