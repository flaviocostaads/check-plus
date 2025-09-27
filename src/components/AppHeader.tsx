import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart3, Bell, Settings, LogOut, User, Menu, Car, FileText, Users, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'inspector' | 'operator';
}

interface AppHeaderProps {
  user?: UserProfile;
  onLogout?: () => void;
  showVehiclePhoto?: boolean;
  vehiclePhotoUrl?: string;
  vehicleName?: string;
}

export const AppHeader = ({ 
  user = { email: "demo@nsa.com", name: "Demo User", role: "admin" as const }, 
  onLogout = () => {}, 
  showVehiclePhoto = false,
  vehiclePhotoUrl = "",
  vehicleName = ""
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_company_settings');

      if (error) throw error;
      if (data && data.length > 0) setCompanySettings(data[0]);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      // Silently fail - don't show toast for header component
    }
  };

  const handleNotifications = () => {
    // TODO: Implementar página de notificações
    console.log("Abrindo notificações...");
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Veículos", href: "/vehicles", icon: Car },
    { name: "Motoristas", href: "/drivers", icon: Users },
    { name: "Checklist", href: "/checklist", icon: CheckSquare },
    { name: "Histórico", href: "/history", icon: FileText },
    { name: "Relatórios", href: "/reports", icon: FileText },
    ...(user.role === 'admin' ? [{ name: "Usuários", href: "/users", icon: Users }] : []),
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        {/* Logo e Nome do App */}
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="bg-gradient-to-r from-primary to-primary-glow p-2 rounded-xl">
            {companySettings?.company_logo_url ? (
              <img 
                src={companySettings.company_logo_url} 
                alt="Logo" 
                className="h-8 w-8 object-contain"
              />
            ) : (
              <BarChart3 className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {companySettings?.company_name || "NSA Checklist"}
            </h1>
          </div>
        </div>

        {/* Slogan */}
        <div className="text-center mb-3">
          <p className="text-sm text-muted-foreground">
            Sistema de Inspeções Veiculares
          </p>
        </div>

        {/* Veículo Selecionado (se houver) */}
        {showVehiclePhoto && vehiclePhotoUrl && (
          <div className="flex items-center justify-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 bg-muted rounded-lg overflow-hidden">
              <img 
                src={vehiclePhotoUrl} 
                alt="Veículo atual"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{vehicleName}</p>
              <p className="text-xs text-muted-foreground">Veículo Selecionado</p>
            </div>
          </div>
        )}
        
        {/* Botões de Ação */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <User className="h-3 w-3 mr-1" />
            {user.role === "admin" ? "Admin" : 
             user.role === "supervisor" ? "Supervisor" :
             user.role === "inspector" ? "Inspetor" : "Operador"}
          </Badge>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={handleNotifications}>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleSettings}>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            {/* Navigation Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Navegação</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navigationItems.map((item) => (
                  <DropdownMenuItem key={item.name} onClick={() => window.location.href = item.href}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback className="text-xs">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;