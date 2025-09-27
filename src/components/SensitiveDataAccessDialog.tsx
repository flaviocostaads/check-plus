import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Clock, AlertTriangle, Key, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SensitiveDataAccessDialogProps {
  children: React.ReactNode;
  onSessionCreated?: (sessionToken: string, accessLevel: string) => void;
}

export default function SensitiveDataAccessDialog({ 
  children, 
  onSessionCreated 
}: SensitiveDataAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessLevel, setAccessLevel] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  const createSensitiveSession = async () => {
    if (!accessLevel || !justification.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o nível de acesso e forneça uma justificativa.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_sensitive_access_session', {
        p_access_level: accessLevel,
        p_justification: justification.trim()
      });

      if (error) throw error;

      const token = data as string;
      setSessionToken(token);
      
      // Set session details for display
      const expiresAt = new Date();
      const minutes = accessLevel === 'full_pii' ? 30 : accessLevel === 'sensitive' ? 60 : 120;
      expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
      
      setSessionDetails({
        accessLevel,
        justification,
        expiresAt,
        token
      });

      // Call callback if provided
      onSessionCreated?.(token, accessLevel);

      toast({
        title: "Sessão criada com sucesso",
        description: `Acesso ${accessLevel} válido por ${minutes} minutos.`
      });

    } catch (error) {
      console.error('Error creating sensitive session:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar sessão de acesso sensível",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAccessLevel("");
    setJustification("");
    setSessionToken(null);
    setSessionDetails(null);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 300); // Reset after dialog closes
  };

  const getAccessLevelInfo = (level: string) => {
    switch (level) {
      case 'sensitive':
        return {
          label: 'Dados Sensíveis',
          description: 'Acesso a telefone, email e CPF/CNH parcialmente mascarados',
          duration: '1 hora',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'full_pii':
        return {
          label: 'PII Completo',
          description: 'Acesso completo a todos os dados pessoais incluindo endereços completos',
          duration: '30 minutos',
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          label: 'Básico',
          description: 'Acesso apenas a dados não sensíveis',
          duration: '2 horas',
          color: 'bg-green-100 text-green-800'
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Acesso a Dados Sensíveis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este sistema requer justificativa e cria sessões com tempo limitado para acesso a dados pessoais de motoristas.
              Todos os acessos são auditados para segurança.
            </AlertDescription>
          </Alert>

          {!sessionToken ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessLevel">Nível de Acesso Necessário</Label>
                <Select value={accessLevel} onValueChange={setAccessLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível de acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sensitive">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Dados Sensíveis</div>
                          <div className="text-xs text-muted-foreground">Telefone, email, CPF/CNH mascarados</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="full_pii">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        <div>
                          <div className="font-medium">PII Completo</div>
                          <div className="text-xs text-muted-foreground">Todos os dados pessoais não mascarados</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {accessLevel && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Detalhes do Nível de Acesso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nível:</span>
                      <Badge className={getAccessLevelInfo(accessLevel).color}>
                        {getAccessLevelInfo(accessLevel).label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Duração:</span>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {getAccessLevelInfo(accessLevel).duration}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getAccessLevelInfo(accessLevel).description}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="justification">Justificativa de Acesso *</Label>
                <Textarea
                  id="justification"
                  placeholder="Ex: Investigação de irregularidade na inspeção ID 12345, solicitado pela supervisão..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Forneça uma justificativa detalhada para auditoria de segurança.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createSensitiveSession}
                  disabled={loading || !accessLevel || !justification.trim()}
                  className="flex-1"
                >
                  {loading ? "Criando..." : "Criar Sessão de Acesso"}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <Key className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800">Sessão Criada com Sucesso!</h3>
                <p className="text-sm text-muted-foreground">
                  Sua sessão de acesso sensível foi criada e está ativa.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detalhes da Sessão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível de Acesso:</span>
                    <Badge className={getAccessLevelInfo(sessionDetails.accessLevel).color}>
                      {getAccessLevelInfo(sessionDetails.accessLevel).label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expira em:</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {sessionDetails.expiresAt.toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Justificativa:</span>
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      {sessionDetails.justification}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Esta sessão será automaticamente registrada nos logs de auditoria. 
                  Use apenas para o propósito declarado na justificativa.
                </AlertDescription>
              </Alert>

              <Button onClick={handleClose} className="w-full">
                Entendido, Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}