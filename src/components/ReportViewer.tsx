import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X, Download, FileText, Car, User, Calendar, MapPin, Eye, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  inspector_signature_data?: string;
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
  damage_markers?: Array<{
    id: string;
    description: string;
    x_position: number;
    y_position: number;
    damage_marker_photos: Array<{
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
          ),
          damage_markers (
            *,
            damage_marker_photos (photo_url)
          )
        `)
        .eq("id", reportId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Erro",
          description: "Relatório não encontrado",
          variant: "destructive"
        });
        return;
      }

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
        return <Badge className={`bg-green-100 text-green-800 status-${status}`}>OK</Badge>;
      case "needs_replacement":
        return <Badge className={`bg-red-100 text-red-800 status-${status}`}>TROCAR</Badge>;
      case "observation":
        return <Badge className={`bg-yellow-100 text-yellow-800 status-${status}`}>OBSERVAR</Badge>;
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

  const handlePrint = () => {
    // Create a new window with all the inspection content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = document.querySelector('.print-area')?.cloneNode(true) as HTMLElement;
    if (!printContent) return;

    // Remove photos from print content
    const photos = printContent.querySelectorAll('.photo-section, img[src*="photo"], .grid img');
    photos.forEach(photo => photo.remove());

    // Remove "Status:" labels from badges
    const badges = printContent.querySelectorAll('.badge, [class*="badge"]');
    badges.forEach(badge => {
      if (badge.textContent) {
        badge.textContent = badge.textContent.replace('Status:', '').trim();
      }
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Inspeção</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .company-header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 15px; }
            .company-header h2 { margin: 0; font-size: 18px; }
            .company-header p { margin: 5px 0; font-size: 12px; }
            .section { margin-bottom: 20px; }
            .section h3 { font-size: 14px; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .grid { display: flex; flex-wrap: wrap; gap: 10px; }
            .grid > div { flex: 1; min-width: 200px; }
            .field { margin-bottom: 8px; }
            .field strong { font-size: 12px; }
            .field span { font-size: 11px; color: #666; }
            .checklist-item { border-bottom: 1px solid #eee; padding: 8px 0; display: flex; justify-content: space-between; align-items: flex-start; }
            .checklist-item .name { font-size: 11px; font-weight: bold; flex: 1; }
            .checklist-item .status { font-size: 10px; padding: 2px 6px; border-radius: 3px; color: white; }
            .status-ok { background: #22c55e; }
            .status-needs_replacement { background: #ef4444; }
            .status-observation { background: #f59e0b; }
            .signature-section { margin-top: 30px; display: flex; gap: 20px; }
            .signature { flex: 1; text-align: center; }
            .signature img { max-width: 150px; max-height: 60px; border: 1px solid #ddd; }
            .signature p { font-size: 10px; margin-top: 5px; }
            .observations { font-size: 10px; color: #666; margin-top: 3px; font-style: italic; }
            @media print {
              body { margin: 0; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={handleOpen}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório de Inspeção Detalhado
            </DialogTitle>
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando detalhes...</p>
          </div>
        ) : inspection ? (
          <div className="space-y-6 print-area">
            {/* Cabeçalho com Logo e Dados da Empresa */}
            <Card>
              <CardHeader className="text-center p-4">
                {/* Logo centralizada */}
                <div className="flex justify-center mb-4">
                  <img src={nsaLogo} alt="NSA Logo" className="h-16 w-auto" />
                </div>
                
                {/* Dados da empresa */}
                <div className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-bold">NORTE SECURITY ADVANCED</h2>
                  <p className="text-sm text-muted-foreground">CNPJ: 41.537.956/0001-04</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Quadra Aço 90 (901 Sul) Alameda 17, SN</p>
                    <p>Sala 02 Quadra06 Lote 03</p>
                    <p>Plano Diretor Sul - Palmas/TO - CEP: 77017-266</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Informações do Relatório */}
            <Card>
              <CardHeader className="text-center p-4">
                {/* Título do relatório */}
                <CardTitle className="text-center text-base sm:text-lg font-bold mb-3">
                  RELATÓRIO DE INSPEÇÃO VEICULAR
                </CardTitle>
                
                {/* Informações do relatório */}
                <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-1">
                  <p>Data: {format(new Date(inspection.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  <p>ID: {inspection.id.slice(0, 8)}</p>
                  <div className="flex justify-center gap-2 mt-2">
                    {(() => {
                      const issues = inspection.inspection_items?.filter(item => 
                        item.status === 'needs_replacement' || item.status === 'observation'
                      ).length || 0;
                      return issues > 0 ? (
                        <Badge variant={issues <= 2 ? "secondary" : "destructive"}>
                          {issues} problema{issues > 1 ? 's' : ''} encontrado{issues > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Nenhum problema encontrado
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
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
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <p className="text-sm font-medium">Tipo:</p>
                  <p className="text-sm text-muted-foreground">
                    {inspection.vehicles.vehicle_type === "car" ? "Carro" : "Moto"}
                  </p>
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
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Resumo removido conforme solicitado */}

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
                     {/* Show photos in view but hide in print */}
                     {item.inspection_photos && item.inspection_photos.length > 0 && (
                       <div className="mt-3 no-print">
                         <p className="text-sm font-medium mb-2">Fotos do item:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                           {item.inspection_photos.map((photo: any, photoIndex: number) => (
                             <div key={photoIndex} className="relative group">
                               <img
                                 src={photo.photo_url}
                                 alt={`Foto ${item.checklist_templates.name} - ${photoIndex + 1}`}
                                 className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                 onClick={() => window.open(photo.photo_url, '_blank')}
                               />
                               <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded flex items-center justify-center">
                                 <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                ))}
              </CardContent>
            </Card>

            {/* Fotos de Danos (se existirem) */}
            {inspection.damage_markers && inspection.damage_markers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Danos Identificados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inspection.damage_markers.map((marker: any, index: number) => (
                    <div key={marker.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium">Dano {index + 1}: {marker.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Posição: X: {marker.x_position}, Y: {marker.y_position}
                          </p>
                        </div>
                      </div>
                      {marker.damage_marker_photos && marker.damage_marker_photos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Fotos do dano:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {marker.damage_marker_photos.map((photo: any, photoIndex: number) => (
                              <div key={photoIndex} className="relative group">
                                <img
                                  src={photo.photo_url}
                                  alt={`Foto dano ${index + 1} - ${photoIndex + 1}`}
                                  className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(photo.photo_url, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded flex items-center justify-center">
                                  <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Assinaturas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assinatura do motorista */}
              {inspection.signature_data && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assinatura do Condutor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <img 
                        src={inspection.signature_data} 
                        alt="Assinatura do condutor" 
                        className="max-w-full h-32 object-contain mx-auto"
                      />
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        Assinado por: {inspection.driver_name}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assinatura do inspetor */}
              {inspection.inspector_signature_data && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assinatura do Inspetor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <img 
                        src={inspection.inspector_signature_data} 
                        alt="Assinatura do inspetor" 
                        className="max-w-full h-32 object-contain mx-auto"
                      />
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        NSA - Norte Security Advanced
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Localização da Inspeção */}
            {(inspection.latitude && inspection.longitude) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Localização da Inspeção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Latitude: {inspection.latitude}, Longitude: {inspection.longitude}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.open(`https://maps.google.com/?q=${inspection.latitude},${inspection.longitude}`, '_blank')}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver no Google Maps
                  </Button>
                </CardContent>
              </Card>
            )}

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