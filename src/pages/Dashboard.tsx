import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Car, 
  Bike, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  MapPin,
  Search,
  Filter,
  Bell,
  Settings,
  LogOut,
  Plus,
  ArrowRight,
  Activity,
  Trash2
} from "lucide-react";
import { User } from "@/types/inspection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DashboardProps {
  user?: User;
  onNewInspection?: () => void;  
  onLogout?: () => void;
}

interface InspectionData {
  id: string;
  driver_name: string;
  created_at: string;
  vehicles: {
    marca_modelo: string;
    placa: string;
    vehicle_type: string;
  };
  inspection_items: {
    status: string;
  }[];
}

interface Stats {
  totalInspections: number;
  completedToday: number;
  pendingInspections: number;
  activeVehicles: number;
  criticalIssues: number;
  monthlyGrowth: number;
}

const Dashboard = ({ 
  user = { email: "demo@nsa.com", name: "Demo User", role: "operator" as const }, 
  onNewInspection, 
  onLogout = () => {} 
}: DashboardProps = {}) => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalInspections: 0,
    completedToday: 0,
    pendingInspections: 0,
    activeVehicles: 0,
    criticalIssues: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent inspections
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select(`
          id,
          driver_name,
          created_at,
          vehicles (
            marca_modelo,
            placa,
            vehicle_type
          ),
          inspection_items (
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (inspectionsError) throw inspectionsError;

      // Fetch vehicles count
      const { count: vehiclesCount, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      if (vehiclesError) throw vehiclesError;

      // Calculate stats
      const totalInspections = inspectionsData?.length || 0;
      const today = new Date().toDateString();
      const completedToday = inspectionsData?.filter(inspection => 
        new Date(inspection.created_at).toDateString() === today
      ).length || 0;

      const criticalIssues = inspectionsData?.reduce((acc, inspection) => {
        const issues = inspection.inspection_items?.filter(item => 
          item.status === 'needs_replacement'
        ).length || 0;
        return acc + (issues > 0 ? 1 : 0);
      }, 0) || 0;

      setInspections(inspectionsData || []);
      setStats({
        totalInspections,
        completedToday,
        pendingInspections: 0, // We don't have pending status in our current schema
        activeVehicles: vehiclesCount || 0,
        criticalIssues,
        monthlyGrowth: 0 // This would need historical data to calculate
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewInspection = () => {
    if (onNewInspection) {
      onNewInspection();
    } else {
      navigate('/inspection');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getIssuesBadgeVariant = (issues: number) => {
    if (issues === 0) return "default";
    if (issues <= 2) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-primary to-primary-glow p-2 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  NSA Checklist Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema de Gestão de Inspeções Veiculares
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Users className="h-3 w-3 mr-1" />
                {user.role === "admin" ? "Administrador" : "Operador"}
              </Badge>
              
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <Settings className="h-5 w-5 text-muted-foreground" />
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Bem-vindo, {user.name}! 👋
                </h2>
                <p className="text-muted-foreground mb-4">
                  Gerencie suas inspeções veiculares de forma eficiente e mantenha seus veículos sempre seguros.
                </p>
                <Button onClick={handleNewInspection} className="bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Inspeção
                </Button>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/50 rounded-xl p-4 text-center">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Hoje</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Inspeções Hoje</p>
                  <p className="text-2xl font-bold text-blue-900">{loading ? '...' : stats.completedToday}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    Dados atuais
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total de Inspeções</p>
                  <p className="text-2xl font-bold text-green-900">{loading ? '...' : stats.totalInspections}</p>
                  <p className="text-xs text-green-600 mt-1">
                    <Activity className="h-3 w-3 inline mr-1" />
                    Histórico completo
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-900">{loading ? '...' : stats.pendingInspections}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Aguardando
                  </p>
                </div>
                <div className="bg-orange-500 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Veículos Ativos</p>
                  <p className="text-2xl font-bold text-purple-900">{loading ? '...' : stats.activeVehicles}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    <Car className="h-3 w-3 inline mr-1" />
                    Em operação
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-full">
                  <Car className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Inspections */}
          <div className="lg:col-span-2">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Inspeções Recentes
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando inspeções...</p>
                  </div>
                ) : inspections.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma inspeção encontrada</p>
                    <Button onClick={handleNewInspection} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeira inspeção
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inspections.map((inspection) => {
                      const issues = inspection.inspection_items?.filter(item => 
                        item.status === 'needs_replacement' || item.status === 'observation'
                      ).length || 0;
                      
                      return (
                        <div key={inspection.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              {inspection.vehicles.vehicle_type === "moto" ? 
                                <Bike className="h-5 w-5 text-primary" /> : 
                                <Car className="h-5 w-5 text-primary" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{inspection.vehicles.marca_modelo}</p>
                              <p className="text-sm text-muted-foreground">
                                {inspection.vehicles.placa} • {inspection.driver_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(inspection.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Badge variant={getIssuesBadgeVariant(issues)}>
                              {issues === 0 ? "OK" : `${issues} problema${issues > 1 ? 's' : ''}`}
                            </Badge>
                            
                            <Badge className="text-green-600 bg-green-50 border-green-200">
                              Concluída
                            </Badge>
                            
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" title="Ver detalhes" onClick={() => navigate('/history')}>
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleNewInspection} className="w-full justify-start bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Inspeção
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/vehicles'}>
                  <Car className="h-4 w-4 mr-2" />
                  Gerenciar Veículos
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/history'}>
                  <FileText className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/drivers'}>
                  <Users className="h-4 w-4 mr-2" />
                  Motoristas
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/users'}>
                  <Users className="h-4 w-4 mr-2" />
                  Usuários
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/settings'}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desempenho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Inspeções OK</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Eficiência</span>
                    <span className="font-medium">94%</span>
                  </div>  
                  <Progress value={94} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Meta Mensal</span>
                    <span className="font-medium">73%</span>
                  </div>
                  <Progress value={73} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Critical Issues Alert */}
            {!loading && stats.criticalIssues > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Atenção Requerida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-red-600 mb-3">
                    {stats.criticalIssues} veículo{stats.criticalIssues > 1 ? 's' : ''} com problemas críticos requer{stats.criticalIssues === 1 ? '' : 'em'} atenção imediata.
                  </div>
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => navigate('/history')}>
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;