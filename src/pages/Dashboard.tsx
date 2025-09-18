import { useState } from "react";
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
  Activity
} from "lucide-react";
import { User } from "@/types/inspection";

interface DashboardProps {
  user?: User;
  onNewInspection?: () => void;  
  onLogout?: () => void;
}

const Dashboard = ({ 
  user = { email: "demo@nsa.com", name: "Demo User", role: "operator" as const }, 
  onNewInspection = () => {}, 
  onLogout = () => {} 
}: DashboardProps = {}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  // Mock data for demonstration
  const mockInspections = [
    { id: 1, vehicle: "Honda Civic LXR 2020", plate: "ABC-1234", driver: "João Silva", status: "completed", issues: 2, date: "2024-01-15" },
    { id: 2, vehicle: "Toyota Corolla XEI 2019", plate: "XYZ-5678", driver: "Maria Santos", status: "pending", issues: 0, date: "2024-01-15" },
    { id: 3, vehicle: "Honda CB 600F 2021", plate: "MOT-9876", driver: "Carlos Lima", status: "completed", issues: 1, date: "2024-01-14" },
    { id: 4, vehicle: "Volkswagen Gol 2018", plate: "DEF-4567", driver: "Ana Costa", status: "completed", issues: 3, date: "2024-01-14" },
  ];

  const mockStats = {
    totalInspections: 147,
    completedToday: 12,
    pendingInspections: 8,
    activeVehicles: 85,
    criticalIssues: 5,
    monthlyGrowth: 23.5
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
                <Button onClick={onNewInspection} className="bg-gradient-primary hover:opacity-90">
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
                  <p className="text-2xl font-bold text-blue-900">{mockStats.completedToday}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +{mockStats.monthlyGrowth}% este mês
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
                  <p className="text-2xl font-bold text-green-900">{mockStats.totalInspections}</p>
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
                  <p className="text-2xl font-bold text-orange-900">{mockStats.pendingInspections}</p>
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
                  <p className="text-2xl font-bold text-purple-900">{mockStats.activeVehicles}</p>
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
                <div className="space-y-4">
                  {mockInspections.map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          {inspection.vehicle.includes("CB") ? 
                            <Bike className="h-5 w-5 text-primary" /> : 
                            <Car className="h-5 w-5 text-primary" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{inspection.vehicle}</p>
                          <p className="text-sm text-muted-foreground">
                            {inspection.plate} • {inspection.driver}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(inspection.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge variant={getIssuesBadgeVariant(inspection.issues)}>
                          {inspection.issues === 0 ? "OK" : `${inspection.issues} problema${inspection.issues > 1 ? 's' : ''}`}
                        </Badge>
                        
                        <Badge className={getStatusColor(inspection.status)}>
                          {inspection.status === "completed" ? "Concluída" : "Pendente"}
                        </Badge>
                        
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <Button onClick={onNewInspection} className="w-full justify-start bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Inspeção
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Car className="h-4 w-4 mr-2" />
                  Gerenciar Veículos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Usuários
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
            {mockStats.criticalIssues > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Atenção Requerida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-red-600 mb-3">
                    {mockStats.criticalIssues} veículo{mockStats.criticalIssues > 1 ? 's' : ''} com problemas críticos requer{mockStats.criticalIssues === 1 ? '' : 'em'} atenção imediata.
                  </div>
                  <Button variant="destructive" size="sm" className="w-full">
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