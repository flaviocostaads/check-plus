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
  Plus
} from "lucide-react";
import { User } from "@/types/inspection";
import appLogo from "@/assets/app-logo.png";

interface DashboardProps {
  user?: User;
  onNewInspection?: () => void;
  onLogout?: () => void;
}

const Dashboard = ({ user, onNewInspection, onLogout }: DashboardProps) => {

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

export default function Dashboard({ user, onNewInspection, onLogout }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredInspections = mockInspections.filter(inspection =>
    inspection.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspection.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspection.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-card shadow-medium border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <img src={appLogo} alt="NSA" className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">NSA Checklist</h1>
                  <p className="text-sm text-muted-foreground">Sistema de Inspeção Veicular</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onLogout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user.name}!</h2>
              <p className="text-primary-foreground/80 mb-4">
                Gerencie inspeções veiculares com eficiência e controle total
              </p>
              <Button 
                onClick={onNewInspection}
                className="bg-white text-primary hover:bg-white/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Inspeção
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                <Car className="w-16 h-16 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Total de Inspeções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.totalInspections}</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-success mr-1" />
                <span className="text-sm text-success">+{mockStats.monthlyGrowth}%</span>
                <span className="text-sm text-muted-foreground ml-1">este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Concluídas Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.completedToday}</div>
              <div className="mt-2">
                <Progress value={75} className="h-2" />
                <span className="text-sm text-muted-foreground mt-1 block">75% da meta diária</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{mockStats.pendingInspections}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Aguardando finalização
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Problemas Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{mockStats.criticalIssues}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Requer atenção imediata
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Inspeções por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gradient-card rounded-lg">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Gráfico de inspeções mensais</p>
                  <p className="text-sm">Dados em tempo real</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Status da Frota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-primary" />
                  <span className="text-sm">Carros</span>
                </div>
                <Badge variant="secondary">68</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bike className="w-4 h-4 text-info" />
                  <span className="text-sm">Motos</span>
                </div>
                <Badge variant="secondary">17</Badge>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Ativo</span>
                  <Badge className="bg-gradient-primary">{mockStats.activeVehicles}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Inspections */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Inspeções Recentes
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar inspeções..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredInspections.map((inspection) => (
                <div key={inspection.id} className="flex items-center justify-between p-4 bg-gradient-card rounded-lg border hover:shadow-soft transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      {inspection.vehicle.includes('CB') ? 
                        <Bike className="w-5 h-5 text-primary" /> : 
                        <Car className="w-5 h-5 text-primary" />
                      }
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{inspection.vehicle}</div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-2">
                        <span>{inspection.plate}</span>
                        <span>•</span>
                        <span>{inspection.driver}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {inspection.issues > 0 && (
                      <Badge variant="outline" className="text-warning border-warning">
                        {inspection.issues} problema{inspection.issues > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge className={getStatusColor(inspection.status)}>
                      {inspection.status === 'completed' ? 'Concluída' : 'Pendente'}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {new Date(inspection.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}