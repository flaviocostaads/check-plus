import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X, Download, FileText, Car, User, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReportGenerator from "./ReportGenerator";
import nsaLogo from "@/assets/nsa-logo.jpg";

interface ReportViewerProps {
  reportId: string;
  children: React.ReactNode;
}

interface InspectionDetails {
  id: string;
  created_at: string;
  driver_name: string;
  driver_cpf: string;
  driver_cnh: string;
  driver_cnh_validade: string;
  odometer_photo_url?: string;
  signature_data?: string;
  latitude?: number;
  longitude?: number;
  vehicles: {
    marca_modelo: string;
    placa: string;
    cor: string;
    ano: string;
    renavam: string;
    km_atual?: string;
    vehicle_type: string;
    cidade?: string;
    estado?: string;
  };
  inspection_items: Array<{
    id: string;
    status: string;
    observations?: string;
    checklist_templates: {
      name: string;
      requires_photo: boolean;
    };
    inspection_photos: Array<{
      photo_url: string;
    }>;
  }>;
}

export default function ReportViewer({ reportId, children }: ReportViewerProps) {
  const [inspection, setInspection] = useState<InspectionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchInspectionDetails = async () => {
    if (!reportId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inspections")
        .select(`
          *,
          vehicles (*),
          inspection_items (
            *,
            checklist_templates (name, requires_photo),
            inspection_photos (photo_url)
          )
        `)
        .eq("id", reportId)
        .single();

      if (error) throw error;

      setInspection(data);
    } catch (error) {
      console.error("Erro ao buscar detalhes da inspeção:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes da inspeção",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchInspectionDetails();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case "needs_replacement":
        return <Badge className="bg-red-100 text-red-800">Trocar</Badge>;
      case "observation":
        return <Badge className="bg-yellow-100 text-yellow-800">Observar</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  const getStatusSummary = () => {
    if (!inspection?.inspection_items) return { ok: 0, needs_replacement: 0, observation: 0 };
    
    const summary = { ok: 0, needs_replacement: 0, observation: 0 };
    inspection.inspection_items.forEach(item => {
      if (item.status === "ok") summary.ok++;
      else if (item.status === "needs_replacement") summary.needs_replacement++;
      else if (item.status === "observation") summary.observation++;
    });
    return summary;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={handleOpen}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Inspeção Detalhado
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando detalhes...</p>
          </div>
        ) : inspection ? (
          <div className="space-y-6">
            {/* Cabeçalho com Logo */}
            <Card>
              <CardHeader className="text-center border-b">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <img src={nsaLogo} alt="NSA Logo" className="h-16" />
                  <div>
                    <h2 className="text-xl font-bold">NORTE SECURITY ADVANCED LTDA</h2>
                    <p className="text-sm text-muted-foreground">CNPJ: 41.537.956/0001-04</p>
                    <p className="text-xs text-muted-foreground">
                      Quadra Aço 90 (901 Sul) Alameda 17, SN - Sala 02 Quadra06 Lote 03<br/>
                      Plano Diretor Sul - Palmas/TO - CEP: 77017-266
                    </p>
                  </div>
                </div>
                <CardTitle className="text-center">RELATÓRIO DE INSPEÇÃO VEICULAR</CardTitle>
                <p className="text-center text-sm text-muted-foreground">
                  Data: {format(new Date(inspection.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })} | 
                  ID: {inspection.id.slice(0, 8)}
                </p>
              </CardHeader>
            </Card>

            {/* Dados do Veículo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Dados do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Marca/Modelo:</p>
                  <p className="text-sm text-muted-foreground">{inspection.vehicles.marca_modelo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Placa:</p>
                  <p className="text-sm text-muted-foreground">{inspection.vehicles.placa}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cor:</p>
                  <p className="text-sm text-muted-foreground">{inspection.vehicles.cor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Ano:</p>
                  <p className="text-sm text-muted-foreground">{inspection.vehicles.ano}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Renavam:</p>
                  <p className="text-sm text-muted-foreground">{inspection.vehicles.renavam}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">KM Atual:</p>
                  <p className="text-sm text-muted-foreground">{inspection.vehicles.km_atual || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Condutor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Condutor
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Nome Completo:</p>
                  <p className="text-sm text-muted-foreground">{inspection.driver_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">CPF:</p>
                  <p className="text-sm text-muted-foreground">{inspection.driver_cpf}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">CNH:</p>
                  <p className="text-sm text-muted-foreground">{inspection.driver_cnh}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Validade CNH:</p>
                  <p className="text-sm text-muted-foreground">{inspection.driver_cnh_validade}</p>
                </div>
              </CardContent>
            </Card>

            {/* Resumo da Inspeção */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Inspeção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {(() => {
                    const summary = getStatusSummary();
                    return (
                      <>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{summary.ok}</div>
                          <div className="text-sm text-muted-foreground">Itens OK</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{summary.needs_replacement}</div>
                          <div className="text-sm text-muted-foreground">Trocar</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">{summary.observation}</div>
                          <div className="text-sm text-muted-foreground">Observar</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Checklist Detalhado */}
            <Card>
              <CardHeader>
                <CardTitle>Itens Verificados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspection.inspection_items?.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{index + 1}. {item.checklist_templates.name}</p>
                        {item.observations && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Observações: {item.observations}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                    {item.inspection_photos && item.inspection_photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {item.inspection_photos.map((photo, photoIndex) => (
                          <img
                            key={photoIndex}
                            src={photo.photo_url}
                            alt={`Foto ${photoIndex + 1}`}
                            className="w-24 h-24 object-cover rounded border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <ReportGenerator 
                inspection={{
                  id: inspection.id,
                  createdAt: new Date(inspection.created_at),
                  vehicleData: {
                    marca_modelo: inspection.vehicles.marca_modelo,
                    placa: inspection.vehicles.placa,
                    cor: inspection.vehicles.cor,
                    ano: inspection.vehicles.ano,
                    renavam: inspection.vehicles.renavam,
                    km_atual: inspection.vehicles.km_atual || "N/A"
                  },
                  driverData: {
                    nome_completo: inspection.driver_name,
                    cpf: inspection.driver_cpf,
                    cnh_numero: inspection.driver_cnh,
                    cnh_validade: inspection.driver_cnh_validade
                  },
                  checklistItems: inspection.inspection_items?.map(item => ({
                    id: item.id,
                    name: item.checklist_templates.name,
                    status: item.status as any,
                    observations: item.observations,
                    photos: item.inspection_photos?.map(p => p.photo_url) || []
                  })) || [],
                  vehicleType: inspection.vehicles.vehicle_type as 'car' | 'moto'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erro ao carregar dados da inspeção</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}