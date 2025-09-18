import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Lock, Car, CheckCircle, BarChart3, FileText, Smartphone, Zap } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

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

  if (!showLogin) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-primary">
          <div className="absolute inset-0 bg-gradient-blue-dark opacity-90"></div>
          <div className="relative px-6 py-20 text-center">
            <div className="mx-auto w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mb-8 shadow-glow">
              <img src={appLogo} alt="NSA Checklist" className="w-14 h-14" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              NSA Checklist
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Sistema Inteligente de Inspeção Veicular
            </p>
            <p className="text-lg text-white/80 mb-12 max-w-3xl mx-auto">
              Transforme suas inspeções com tecnologia moderna, relatórios automatizados e controle total da sua frota
            </p>
            <Button 
              onClick={() => setShowLogin(true)}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-xl shadow-elegant"
            >
              <Shield className="w-5 h-5 mr-2" />
              Acessar Sistema
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Tudo que você precisa para gerenciar sua frota
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Solução completa para inspeções veiculares com tecnologia mobile, relatórios em PDF e dashboard executivo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center shadow-soft hover:shadow-medium transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">App Mobile</h3>
                  <p className="text-muted-foreground">Interface otimizada para uso em campo com câmera integrada</p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-soft hover:shadow-medium transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Relatórios PDF</h3>
                  <p className="text-muted-foreground">Geração automática de relatórios profissionais com fotos</p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-soft hover:shadow-medium transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Dashboard</h3>
                  <p className="text-muted-foreground">Controle total com métricas e estatísticas em tempo real</p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-soft hover:shadow-medium transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Integração</h3>
                  <p className="text-muted-foreground">WhatsApp, email e sincronização automática offline</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-card py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">99%</div>
                <div className="text-lg text-muted-foreground">Precisão nas Inspeções</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">5min</div>
                <div className="text-lg text-muted-foreground">Tempo Médio por Inspeção</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-lg text-muted-foreground">Funcionamento Offline</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h3 className="text-3xl font-bold text-white mb-4">
              Pronto para modernizar suas inspeções?
            </h3>
            <p className="text-xl text-white/90 mb-8">
              Versão Beta disponível para testes. Entre agora e experimente!
            </p>
            <Button 
              onClick={() => setShowLogin(true)}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-xl"
            >
              <User className="w-5 h-5 mr-2" />
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowLogin(false)}
            className="absolute top-4 left-4"
          >
            ← Voltar
          </Button>
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
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
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {user.role === 'admin' ? 'Admin' : 'Operador'}
                  </Badge>
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