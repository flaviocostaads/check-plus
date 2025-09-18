import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, Lock } from "lucide-react";
import { toast } from "sonner";
import appLogo from "@/assets/app-logo.png";

export type UserRole = 'admin' | 'operator';

interface User {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

interface LoginFormProps {
  onLogin: (user: User) => void;
}

// Demo users for beta
const DEMO_USERS: User[] = [
  {
    email: 'admin@nsa.com',
    password: 'admin123',
    role: 'admin',
    name: 'Administrador NSA'
  },
  {
    email: 'operador@nsa.com', 
    password: 'op123',
    role: 'operator',
    name: 'Operador de Campo'
  }
];

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Demo authentication
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
      toast.success(`Bem-vindo, ${user.name}!`);
      onLogin(user);
    } else {
      toast.error('Email ou senha incorretos');
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = (userEmail: string) => {
    const user = DEMO_USERS.find(u => u.email === userEmail);
    if (user) {
      setEmail(user.email);
      setPassword(user.password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <img src={appLogo} alt="NSA Checklist" className="w-12 h-12" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">NSA Checklist</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Sistema de Inspeção Veicular
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Acesso Demo (Beta)
            </h3>
            <div className="space-y-2">
              {DEMO_USERS.map((user) => (
                <Button
                  key={user.email}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleDemoLogin(user.email)}
                >
                  <User className="w-4 h-4 mr-2" />
                  {user.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {user.role === 'admin' ? 'Admin' : 'Operador'}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            Versão Beta - NSA Checklist System
          </div>
        </CardContent>
      </Card>
    </div>
  );
}