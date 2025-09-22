import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import DriverFormDialog from "@/components/DriverFormDialog";

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

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Check user role first to determine access level
      const { data: userData } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      let data;

      if (userData?.role === 'admin') {
        // Admin access - direct query with full data
        const { data: adminData, error } = await supabase
          .from('drivers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Database error:', error);
          toast.error('Erro ao carregar motoristas');
          return;
        }
        
        data = adminData || [];
      } else {
        // Operator access - direct query with masked data
        const { data: operatorData, error } = await supabase
          .from('drivers')
          .select('id, nome_completo, cpf, cnh_numero, cnh_validade, telefone, avatar_url, is_active, created_at, updated_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Database error:', error);
          toast.error('Erro ao carregar motoristas');
          return;
        }
        
        // Map the data with masking for operators
        data = (operatorData || []).map(driver => ({
          id: driver.id,
          nome_completo: driver.nome_completo,
          cpf: driver.cpf ? driver.cpf.substring(0, 3) + '.***.***-**' : '***.***.***-**',
          cnh_numero: driver.cnh_numero ? driver.cnh_numero.substring(0, 3) + '********' : '***********',
          cnh_validade: driver.cnh_validade,
          telefone: driver.telefone ? driver.telefone.substring(0, 2) + '*****-****' : null,
          email: '', // Not available in operator view
          endereco: '', // Not available in operator view
          avatar_url: driver.avatar_url,
          created_at: driver.created_at,
          updated_at: driver.updated_at,
          is_active: driver.is_active
        }));
        
        toast.info('Visualização com dados mascarados para operadores');
      }
      
      setDrivers(data || []);
      
      // Fetch stats for each driver using secure method
      if (data) {
        try {
          // Use individual stats fetching (secure view not yet in types)
          const statsPromises = data.map(driver => fetchDriverStats(driver.id));
          const stats = await Promise.all(statsPromises);
          const statsMap = data.reduce((acc, driver, index) => {
            acc[driver.id] = stats[index];
            return acc;
          }, {} as Record<string, DriverStats>);
          setDriverStats(statsMap);
        } catch (error) {
          console.error('Error fetching driver stats:', error);
        }
      }
      
    } catch (error) {
      console.error('Error in fetchDrivers:', error);
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

  const handleDriverCreated = (newDriver: any) => {
    fetchDrivers();
    toast.success("Motorista cadastrado com sucesso!");
  };

  const handleDelete = async (driverId: string) => {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('não autorizado')) {
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

  const filteredDrivers = drivers.filter(driver =>
    driver.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.cpf.includes(searchTerm) ||
    driver.cnh_numero.includes(searchTerm)
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
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Motorista
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
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
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum motorista encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "Tente ajustar os filtros de busca" : "Comece cadastrando seu primeiro motorista"}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Motorista
            </Button>
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
                        onClick={() => toast.info("Funcionalidade de edição em desenvolvimento")}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(driver.id)}
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
        
        <DriverFormDialog 
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onDriverCreated={handleDriverCreated}
        />
      </div>
    </div>
  );
}