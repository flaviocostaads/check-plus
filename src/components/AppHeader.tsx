import { useState, useEffect } from "react";
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
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setCompanySettings(data);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    }
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
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {companySettings?.company_name || "NSA Checklist"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema de Gestão de Inspeções Veiculares
              </p>
            </div>
            
            {showVehiclePhoto && vehiclePhotoUrl && (
              <div className="flex items-center gap-2 ml-8 p-2 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={vehiclePhotoUrl} 
                    alt="Veículo atual"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{vehicleName}</p>
                  <p className="text-xs text-muted-foreground">Veículo Selecionado</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <User className="h-3 w-3 mr-1" />
              {user.role === "admin" ? "Administrador" : 
               user.role === "supervisor" ? "Supervisor" :
               user.role === "inspector" ? "Inspetor" : "Operador"}
            </Badge>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              {/* Navigation Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5 text-muted-foreground" />
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
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
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
      </div>
    </header>
  );
};

export default AppHeader;