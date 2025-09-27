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
  Trash2,
  ClipboardList
} from "lucide-react";
import { QuickActions } from "@/components/QuickActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReportViewer from "@/components/ReportViewer";

interface DashboardProps {
  onNewInspection?: () => void;  
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
  onNewInspection = () => {}
}: DashboardProps = {}) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
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
  const [activeDriversCount, setActiveDriversCount] = useState(0);
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
        .limit(3);

      if (inspectionsError) throw inspectionsError;

      // Get dashboard statistics using the new secure function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_dashboard_stats');

      if (statsError) {
        console.warn('Could not fetch dashboard stats:', statsError);
        // Use fallback values
        setActiveDriversCount(0);
        setStats({
          totalInspections: inspectionsData?.length || 0,
          completedToday: inspectionsData?.filter(inspection => 
            new Date(inspection.created_at).toDateString() === new Date().toDateString()
          ).length || 0,
          pendingInspections: 0,
          activeVehicles: 0,
          criticalIssues: 0,
          monthlyGrowth: 0
        });
      } else if (statsData && statsData.length > 0) {
        const stats = statsData[0];
        setActiveDriversCount(Number(stats.active_drivers));
        
        // Calculate other stats
        const totalInspections = Number(stats.total_inspections);
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

        setStats({
          totalInspections,
          completedToday,
          pendingInspections: 0,
          activeVehicles: Number(stats.active_vehicles),
          criticalIssues,
          monthlyGrowth: 0
        });
      }

      setInspections(inspectionsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Erro ao carregar dados do dashboard");
      
      // Set fallback values to prevent UI crashes
      setActiveDriversCount(0);
      setStats({
        totalInspections: 0,
        completedToday: 0,
        pendingInspections: 0,
        activeVehicles: 0,
        criticalIssues: 0,
        monthlyGrowth: 0
      });
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewInspection = () => {
    if (onNewInspection) {
      onNewInspection();
    } else {
      navigate('/new-inspection');
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
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 lg:mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-2xl p-4 sm:p-6 border border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Bem-vindo, {userProfile?.name}! 👋
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Gerencie suas inspeções veiculares de forma eficiente e mantenha seus veículos sempre seguros.
                </p>
                <Button onClick={handleNewInspection} className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Inspeção
                </Button>
              </div>
              <div className="sm:block">
                <div className="bg-white/50 rounded-xl p-4 text-center">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Hoje</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Moved here after Welcome Section */}
        <div className="mb-6 lg:mb-8">
          <QuickActions userRole={userProfile?.role} onNewInspection={handleNewInspection} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
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
                  <p className="text-orange-600 text-sm font-medium">Motoristas Ativos</p>
                  <p className="text-2xl font-bold text-orange-900">{loading ? '...' : activeDriversCount}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    <Users className="h-3 w-3 inline mr-1" />
                    Em atividade
                  </p>
                </div>
                <div className="bg-orange-500 p-3 rounded-full">
                  <Users className="h-6 w-6 text-white" />
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
        <div className="grid grid-cols-1 gap-4 lg:gap-8">
          {/* Recent Inspections */}
          <div>
            <Card className="h-fit">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Inspeções Recentes
                  </CardTitle>
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
                        <div key={inspection.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors gap-4">
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
                              <ReportViewer reportId={inspection.id}>
                                <Button variant="ghost" size="sm" title="Ver detalhes">
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </ReportViewer>
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
  );
};

export default Dashboard;