import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Eye, 
  Clock, 
  User, 
  AlertTriangle, 
  Activity,
  Calendar,
  Database,
  RefreshCw,
  FileText,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  field_accessed: string;
  access_reason: string;
  ip_address: string;
  created_at: string;
}

interface SensitiveSession {
  id: string;
  user_id: string;
  access_level: string;
  justification: string;
  expires_at: string;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
}

export default function SecurityAuditDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sensitiveSessions, setSensitiveSessions] = useState<SensitiveSession[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAccess: 0,
    activeSessions: 0,
    suspiciousActivity: 0,
    businessHoursAccess: 0
  });

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      // Fetch audit logs
      const { data: logs, error: logsError } = await supabase
        .from('sensitive_data_access_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error('Error fetching audit logs:', logsError);
      } else {
        setAuditLogs(logs || []);
      }

      // Fetch sensitive sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sensitive_access_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      } else {
        setSensitiveSessions(sessions || []);
      }

      // Fetch user profiles for display names
      const userIds = [...new Set([
        ...(logs || []).map(log => log.user_id),
        ...(sessions || []).map(session => session.user_id)
      ])];

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', userIds);

        if (!profilesError && profiles) {
          const profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, UserProfile>);
          setUserProfiles(profilesMap);
        }
      }

      // Calculate stats
      const now = new Date();
      const activeSessions = (sessions || []).filter(s => new Date(s.expires_at) > now).length;
      const totalAccess = (logs || []).length;
      
      // Simple heuristic for suspicious activity (multiple accesses from same user in short time)
      const recentLogs = (logs || []).filter(log => 
        new Date(log.created_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
      );
      const userAccessCounts = recentLogs.reduce((acc, log) => {
        acc[log.user_id] = (acc[log.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const suspiciousActivity = Object.values(userAccessCounts).filter(count => count > 10).length;

      setStats({
        totalAccess,
        activeSessions,
        suspiciousActivity,
        businessHoursAccess: 0 // Could be enhanced with actual business hours calculation
      });

    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de auditoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'sensitive':
        return <Badge className="bg-yellow-100 text-yellow-800">Sensível</Badge>;
      case 'full_pii':
        return <Badge className="bg-red-100 text-red-800">PII Completo</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800">Básico</Badge>;
    }
  };

  const getUserName = (userId: string) => {
    return userProfiles[userId]?.name || userProfiles[userId]?.email || userId.substring(0, 8);
  };

  const isSessionActive = (expiresAt: string) => {
    return new Date(expiresAt) > new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando dados de auditoria...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Acessos</p>
                <p className="text-2xl font-bold">{stats.totalAccess}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessões Ativas</p>
                <p className="text-2xl font-bold">{stats.activeSessions}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atividade Suspeita</p>
                <p className="text-2xl font-bold">{stats.suspiciousActivity}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auditoria</p>
                <p className="text-2xl font-bold">100%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for suspicious activity */}
      {stats.suspiciousActivity > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.suspiciousActivity} usuário(s) com atividade suspeita detectada nas últimas 24 horas.
            Verifique os logs de auditoria para mais detalhes.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs de Acesso</TabsTrigger>
          <TabsTrigger value="sessions">Sessões Sensíveis</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Logs de Acesso a Dados Sensíveis
                </CardTitle>
                <Button variant="outline" size="sm" onClick={fetchAuditData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Campo Acessado</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getUserName(log.user_id)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.table_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.field_accessed}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.access_reason || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {log.ip_address || 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sessões de Acesso Sensível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Criação</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Nível de Acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Justificativa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sensitiveSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {format(new Date(session.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getUserName(session.user_id)}</TableCell>
                        <TableCell>{getAccessLevelBadge(session.access_level)}</TableCell>
                        <TableCell>
                          {isSessionActive(session.expires_at) ? (
                            <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                          ) : (
                            <Badge variant="secondary">Expirada</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {format(new Date(session.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm" title={session.justification}>
                            {session.justification}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}