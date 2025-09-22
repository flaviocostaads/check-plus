import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Car,
  AlertTriangle,
  Camera
} from "lucide-react";
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
  endereco?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DriverStats {
  totalInspections: number;
  vehiclesInspected: number;
  issuesFound: number;
  lastInspection?: string;
}

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverStats, setDriverStats] = useState<Record<string, DriverStats>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    cnh_numero: "",
    cnh_validade: "",
    telefone: "",
    email: "",
    endereco: ""
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Use secure view that respects role-based access control
      const { data, error } = await supabase
        .from('drivers_secure_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        toast.error('Acesso negado: apenas administradores podem gerenciar motoristas');
        return;
      }
      
      setDrivers(data || []);
      
      // Fetch stats for each driver
      if (data) {
        const statsPromises = data.map(driver => fetchDriverStats(driver.id));
        const stats = await Promise.all(statsPromises);
        const statsMap = data.reduce((acc, driver, index) => {
          acc[driver.id] = stats[index];
          return acc;
        }, {} as Record<string, DriverStats>);
        setDriverStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Erro ao carregar motoristas');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverStats = async (driverId: string): Promise<DriverStats> => {
    try {
      const { data: inspections, error } = await supabase
        .from('inspections')
        .select(`
          id,
          created_at,
          vehicle_id,
          inspection_items(status)
        `)
        .eq('driver_id', driverId);

      if (error) throw error;

      const totalInspections = inspections?.length || 0;
      const vehiclesInspected = new Set(inspections?.map(i => i.vehicle_id)).size;
      const issuesFound = inspections?.reduce((acc, inspection) => {
        const issues = inspection.inspection_items?.filter(item => 
          item.status === 'needs_replacement' || item.status === 'observation'
        ).length || 0;
        return acc + issues;
      }, 0) || 0;

      const lastInspection = inspections?.[0]?.created_at;

      return {
        totalInspections,
        vehiclesInspected,
        issuesFound,
        lastInspection
      };
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      return {
        totalInspections: 0,
        vehiclesInspected: 0,
        issuesFound: 0
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedDriver) {
        // Update existing driver
        const { error } = await supabase
          .from('drivers')
          .update(formData)
          .eq('id', selectedDriver.id);

        if (error) {
          if (error.code === 'PGRST301') {
            toast.error("Você não tem permissão para atualizar motoristas. Entre em contato com um administrador.");
            return;
          }
          throw error;
        }
        toast.success("Motorista atualizado com sucesso!");
        setIsEditDialogOpen(false);
      } else {
        // Create new driver
        const { error } = await supabase
          .from('drivers')
          .insert([formData]);

        if (error) {
          if (error.code === 'PGRST301') {
            toast.error("Você não tem permissão para criar motoristas. Entre em contato com um administrador.");
            return;
          }
          throw error;
        }
        toast.success("Motorista cadastrado com sucesso!");
        setIsAddDialogOpen(false);
      }

      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
      toast.error("Erro ao salvar motorista");
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) {
        if (error.code === 'PGRST301') {
          toast.error("Você não tem permissão para excluir motoristas. Entre em contato com um administrador.");
          return;
        }
        throw error;
      }
      
      toast.success("Motorista excluído com sucesso!");
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error("Erro ao excluir motorista");
    }
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      nome_completo: driver.nome_completo,
      cpf: driver.cpf,
      cnh_numero: driver.cnh_numero,
      cnh_validade: driver.cnh_validade,
      telefone: driver.telefone || "",
      email: driver.email || "",
      endereco: driver.endereco || ""
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      cpf: "",
      cnh_numero: "",
      cnh_validade: "",
      telefone: "",
      email: "",
      endereco: ""
    });
    setSelectedDriver(null);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
    }
    return value;
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.cpf.includes(searchTerm) ||
    driver.cnh_numero.includes(searchTerm)
  );

  const DriverForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              const value = e.target.value;
              const numbers = value.replace(/\D/g, '');
              if (numbers.length <= 11) {
                const formatted = formatCPF(numbers);
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
            onChange={(e) => {
              const value = e.target.value;
              const numbers = value.replace(/\D/g, '');
              if (numbers.length <= 11) {
                setFormData(prev => ({ ...prev, cnh_numero: numbers }));
              }
            }}
            placeholder="12345678901"
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
              const value = e.target.value;
              const numbers = value.replace(/\D/g, '');
              if (numbers.length <= 8) {
                const formatted = formatDate(numbers);
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
            onChange={(e) => {
              const value = e.target.value;
              const numbers = value.replace(/\D/g, '');
              if (numbers.length <= 11) {
                const formatted = formatPhone(numbers);
                setFormData(prev => ({ ...prev, telefone: formatted }));
              }
            }}
            placeholder="(11) 99999-9999"
            maxLength={15}
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
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          value={formData.endereco}
          onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
          placeholder="Endereço completo"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {selectedDriver ? "Atualizar" : "Cadastrar"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Gestão de Motoristas
              </h1>
              <p className="text-muted-foreground">
                Gerencie motoristas e acompanhe seu histórico de inspeções
              </p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Motorista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Motorista</DialogTitle>
              </DialogHeader>
              <DriverForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, CPF ou CNH..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Drivers Grid */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando motoristas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => {
              const stats = driverStats[driver.id] || {
                totalInspections: 0,
                vehiclesInspected: 0,
                issuesFound: 0
              };

              return (
                <Card key={driver.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={driver.avatar_url} />
                          <AvatarFallback>
                            {driver.nome_completo.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{driver.nome_completo}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            CPF: {driver.cpf}
                          </p>
                        </div>
                      </div>
                      <Badge variant={driver.is_active ? "default" : "secondary"}>
                        {driver.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>CNH: {driver.cnh_numero}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Validade: {driver.cnh_validade}</span>
                      </div>
                      {driver.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{driver.telefone}</span>
                        </div>
                      )}
                      {driver.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{driver.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Driver Stats */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Inspeções:</span>
                        <span className="font-medium">{stats.totalInspections}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Veículos:</span>
                        <span className="font-medium">{stats.vehiclesInspected}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Problemas:</span>
                        <span className="font-medium flex items-center gap-1">
                          {stats.issuesFound > 0 && (
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          )}
                          {stats.issuesFound}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(driver)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(driver.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredDrivers.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum motorista encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Tente ajustar os filtros de busca" : "Comece cadastrando seu primeiro motorista"}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Motorista
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Motorista</DialogTitle>
          </DialogHeader>
          <DriverForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}