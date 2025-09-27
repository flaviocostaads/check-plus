import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Car, 
  FileText, 
  Users, 
  Settings, 
  ClipboardList 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  userRole?: 'admin' | 'supervisor' | 'inspector' | 'operator';
  onNewInspection?: () => void;
}

export const QuickActions = ({ userRole = 'operator', onNewInspection }: QuickActionsProps) => {
  const navigate = useNavigate();

  const handleNewInspection = () => {
    if (onNewInspection) {
      onNewInspection();
    } else {
      navigate('/new-inspection');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleNewInspection} className="w-full justify-start bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Inspeção
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/vehicles')}>
          <Car className="h-4 w-4 mr-2" />
          Gerenciar Veículos
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/reports')}>
          <FileText className="h-4 w-4 mr-2" />
          Relatórios
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/drivers')}>
          <Users className="h-4 w-4 mr-2" />
          Motoristas
        </Button>
        {(userRole === 'admin' || userRole === 'supervisor') && (
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/user-management')}>
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </Button>
        )}
        <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/checklist')}>
          <ClipboardList className="h-4 w-4 mr-2" />
          Gerenciador de Checklists
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </CardContent>
    </Card>
  );
};