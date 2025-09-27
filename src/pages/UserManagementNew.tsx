import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield,
  ShieldCheck,
  Eye,
  RefreshCw,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'inspector' | 'operator';
  user_id: string;
  created_at: string;
}

interface UserFormData {
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'inspector' | 'operator';
  password: string;
}

export default function UserManagementNew() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'inspector',
    password: ''
  });

  const canCreateUsers = userProfile?.role === 'admin' || userProfile?.role === 'supervisor';
  const canDeleteUsers = userProfile?.role === 'admin';
  
  useEffect(() => {
    if (canCreateUsers) {
      fetchUsers();
    }
  }, [canCreateUsers]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            role: formData.role
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('Usuário atualizado com sucesso');
      } else {
        // Create new user using edge function
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('Sessão expirada. Faça login novamente.');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;

        if (data.error) {
          throw new Error(data.error);
        }

        toast.success('Usuário criado com sucesso');
      }

      // Close dialog and refresh list after successful operation
      handleDialogClose();
      fetchUsers();
    } catch (error: any) {
      console.error('Error managing user:', error);
      toast.error(error.message || 'Erro ao gerenciar usuário');
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!canDeleteUsers) {
      toast.error('Você não tem permissão para excluir usuários');
      return;
    }

    if (user.role === 'admin' && userProfile?.role !== 'admin') {
      toast.error('Apenas administradores podem excluir outros administradores');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: user.user_id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Usuário excluído com sucesso');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    }
  };

  const handleResetPassword = async (user: UserProfile) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
      toast.success('Email de redefinição de senha enviado');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Erro ao redefinir senha');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'inspector',
      password: ''
    });
    setEditingUser(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setTimeout(() => {
      resetForm();
    }, 100); // Small delay to ensure dialog closes smoothly
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'supervisor':
        return 'secondary';
      case 'inspector':
        return 'default';
      case 'operator':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'supervisor':
        return 'Supervisor';
      case 'inspector':
        return 'Inspetor';
      case 'operator':
        return 'Operador';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-4 w-4" />;
      case 'supervisor':
        return <Shield className="h-4 w-4" />;
      case 'inspector':
        return <Eye className="h-4 w-4" />;
      case 'operator':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (!canCreateUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o gerenciamento de usuários.
            </p>
            <Link to="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Gestão de Usuários
              </h1>
              <p className="text-muted-foreground">
                Gerencie os usuários do sistema
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            if (!open) {
              handleDialogClose();
            } else {
              setDialogOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!!editingUser}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userProfile?.role === 'admin' && (
                        <SelectItem value="admin">Administrador</SelectItem>
                      )}
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="inspector">Inspetor</SelectItem>
                      <SelectItem value="operator">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={6}
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Atualizar' : 'Criar'} Usuário
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground">Clique em "Novo Usuário" para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              title="Editar usuário"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                              title="Redefinir senha"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            
                            {canDeleteUsers && user.user_id !== userProfile?.user_id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    title="Excluir usuário"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o usuário "{user.name}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(user)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Permissions Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Níveis de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">Administrador</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Acesso total ao sistema</li>
                  <li>• Gerenciar usuários</li>
                  <li>• Visualizar todas as inspeções</li>
                  <li>• Configurações do sistema</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">Supervisor</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Criar inspetores</li>
                  <li>• Visualizar todas as inspeções</li>
                  <li>• Gerenciar veículos/motoristas</li>
                  <li>• Relatórios completos</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Inspetor</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Criar novas inspeções</li>
                  <li>• Visualizar próprias inspeções</li>
                  <li>• Editar próprias inspeções</li>
                  <li>• Gerar relatórios próprios</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Operador</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Visualizar veículos</li>
                  <li>• Visualizar motoristas</li>
                  <li>• Acesso limitado</li>
                  <li>• Relatórios básicos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}