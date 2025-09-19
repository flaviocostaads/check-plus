import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import appLogo from "@/assets/app-logo.png";

interface AuthFormProps {
  onAuthSuccess: (user: SupabaseUser, session: Session) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        onAuthSuccess(session.user, session);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          onAuthSuccess(session.user, session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name
            }
          }
        });

        if (error) throw error;

        toast.success("Conta criada! Verifique seu email para confirmar.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        toast.success("Login realizado com sucesso!");
      }
    } catch (error: any) {
      let errorMessage = "Erro desconhecido";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Faça login.";
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Email inválido";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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

        {/* Features Section - Keep same as before */}
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
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h3 className="text-3xl font-bold text-white mb-4">
              Pronto para modernizar suas inspeções?
            </h3>
            <p className="text-xl text-white/90 mb-8">
              Crie sua conta e comece a usar o sistema agora mesmo!
            </p>
            <Button 
              onClick={() => setShowLogin(true)}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-xl"
            >
              <User className="w-5 h-5 mr-2" />
              Começar Agora
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
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isSignUp ? "Já tem conta? Fazer login" : "Não tem conta? Cadastre-se"}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            Sistema Seguro - NSA Checklist
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
