import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InspectionHistoryList from "@/components/InspectionHistoryList";

interface Driver {
  id: string;
  nome_completo: string;
  cpf: string;
  cnh_numero: string;
  cnh_validade: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDriver();
    }
  }, [id]);

  const fetchDriver = async () => {
    try {
      const { data, error } = await supabase.rpc('get_drivers_basic_info');

      if (error) throw error;

      const foundDriver = data?.find((d: any) => d.id === id);
      if (foundDriver) {
        // Fetch full details directly from drivers table
        const { data: fullData, error: fullError } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!fullError && fullData) {
          setDriver(fullData);
        } else {
          // If direct access fails, use basic info with defaults for missing fields
          setDriver({
            ...foundDriver,
            cpf: '***.***.***-**',
            cnh_numero: '***********',
            cnh_validade: 'N/A',
            telefone: null,
            email: null,
            endereco: null,
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar motorista:", error);
      toast.error("Erro ao carregar dados do motorista");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Motorista não encontrado</p>
            <Button onClick={() => navigate('/driver-management')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/driver-management')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Gestão de Motoristas
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Informações do Motorista</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={driver.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {driver.nome_completo.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{driver.nome_completo}</h2>
                <Badge variant={driver.is_active ? "default" : "secondary"} className="mt-2">
                  {driver.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">CPF</div>
                    <div className="font-medium">{driver.cpf}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">CNH</div>
                    <div className="font-medium">{driver.cnh_numero}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Validade CNH</div>
                    <div className="font-medium">{driver.cnh_validade}</div>
                  </div>
                </div>

                {driver.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Telefone</div>
                      <div className="font-medium">{driver.telefone}</div>
                    </div>
                  </div>
                )}

                {driver.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium">{driver.email}</div>
                    </div>
                  </div>
                )}

                {driver.endereco && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Endereço</div>
                      <div className="font-medium">{driver.endereco}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <InspectionHistoryList filterId={id} filterType="driver" />
          </div>
        </div>
      </div>
    </div>
  );
}
