import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Eye, Download, Trash2, Car, Bike, Filter, Search, ArrowLeft } from "lucide-react";
import ReportViewer from "@/components/ReportViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface InspectionHistoryItem {
  id: string;
  driver_name: string;
  driver_cpf: string;
  created_at: string;
  vehicles: {
    id: string;
    marca_modelo: string;
    placa: string;
    vehicle_type: string;
  };
}

export const InspectionHistory = () => {
  const [inspections, setInspections] = useState<InspectionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [filteredInspections, setFilteredInspections] = useState<InspectionHistoryItem[]>([]);

  useEffect(() => {
    fetchInspections();
  }, []);

  useEffect(() => {
    let filtered = inspections;
    
    if (searchTerm) {
      filtered = filtered.filter(inspection => 
        inspection.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.vehicles.marca_modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.vehicles.placa.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(inspection => 
        format(new Date(inspection.created_at), "yyyy-MM-dd") === dateFilter
      );
    }
    
    setFilteredInspections(filtered);
  }, [inspections, searchTerm, dateFilter]);

  const fetchInspections = async () => {
    try {
      const { data, error } = await supabase
        .from("inspections")
        .select(`
          id,
          driver_name,
          driver_cpf,
          created_at,
          vehicles (
            id,
            marca_modelo,
            placa,
            vehicle_type
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInspections(data || []);
      setFilteredInspections(data || []);
    } catch (error) {
      console.error("Erro ao buscar inspeções:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de inspeções",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (inspectionId: string) => {
    // This will be handled by ReportViewer component
  };

  const downloadPDF = async (reportId: string) => {
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

      await generateReportPDF(data);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do relatório",
        variant: "destructive"
      });
    }
  };

  const generateReportPDF = async (inspectionData: any) => {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF();

    try {
      // Company header
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('NORTE SECURITY ADVANCED LTDA', 20, 20);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('CNPJ: 41.537.956/0001-04', 20, 27);
      pdf.text('Quadra Aço 90 (901 Sul) Alameda 17, SN - Sala 02 Quadra06 Lote 03', 20, 32);
      pdf.text('Plano Diretor Sul - Palmas/TO - CEP: 77017-266', 20, 37);
      
      // Title
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('RELATÓRIO DE INSPEÇÃO VEICULAR', 20, 50);
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      const createdAt = new Date(inspectionData.created_at);
      pdf.text(`Data: ${createdAt.toLocaleDateString('pt-BR')} às ${createdAt.toLocaleTimeString('pt-BR')}`, 20, 60);
      pdf.text(`ID: ${inspectionData.id.slice(0, 8)}`, 120, 60);

      // Vehicle info section
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('DADOS DO VEÍCULO', 20, 75);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Marca/Modelo: ${inspectionData.vehicles.marca_modelo}`, 20, 85);
      pdf.text(`Placa: ${inspectionData.vehicles.placa}`, 20, 92);
      pdf.text(`Cor: ${inspectionData.vehicles.cor}`, 100, 85);
      pdf.text(`Ano: ${inspectionData.vehicles.ano}`, 100, 92);
      pdf.text(`Renavam: ${inspectionData.vehicles.renavam}`, 20, 99);
      pdf.text(`KM Atual: ${inspectionData.vehicles.km_atual || "N/A"}`, 100, 99);

      // Driver info section
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('DADOS DO CONDUTOR', 20, 115);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nome Completo: ${inspectionData.driver_name}`, 20, 125);
      pdf.text(`CPF: ${inspectionData.driver_cpf}`, 20, 132);
      pdf.text(`CNH: ${inspectionData.driver_cnh}`, 100, 125);
      pdf.text(`Validade CNH: ${inspectionData.driver_cnh_validade}`, 100, 132);

      // Summary section
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('RESUMO DA INSPEÇÃO', 20, 150);
      
      const summary = {
        ok: inspectionData.inspection_items?.filter((i: any) => i.status === 'ok').length || 0,
        needs_replacement: inspectionData.inspection_items?.filter((i: any) => i.status === 'needs_replacement').length || 0,
        observation: inspectionData.inspection_items?.filter((i: any) => i.status === 'observation').length || 0
      };
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`✓ Itens OK: ${summary.ok}`, 30, 162);
      pdf.text(`⚠ Trocar: ${summary.needs_replacement}`, 80, 162);
      pdf.text(`👁 Observar: ${summary.observation}`, 130, 162);
      
      // Checklist items
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('ITENS VERIFICADOS DETALHADAMENTE', 20, 180);
      
      let yPosition = 190;
      inspectionData.inspection_items?.forEach((item: any, index: number) => {
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        const status = item.status === 'ok' ? 'OK ✓' : 
                      item.status === 'needs_replacement' ? 'TROCAR ⚠' : 
                      item.status === 'observation' ? 'OBSERVAR 👁' : 'N/A';
        
        pdf.text(`${index + 1}. ${item.checklist_templates.name}`, 20, yPosition);
        pdf.text(`Status: ${status}`, 140, yPosition);
        
        if (item.observations) {
          yPosition += 7;
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          const maxWidth = 170;
          const splitObs = pdf.splitTextToSize(`Observações: ${item.observations}`, maxWidth);
          pdf.text(splitObs, 25, yPosition);
          yPosition += splitObs.length * 4;
        }
        
        if (item.inspection_photos && item.inspection_photos.length > 0) {
          yPosition += 5;
          pdf.setFontSize(8);
          pdf.setFont(undefined, 'italic');
          pdf.text(`Fotos anexadas: ${item.inspection_photos.length} foto(s)`, 25, yPosition);
        }
        
        yPosition += 12;
      });

      // Signature area
      if (yPosition > 230) {
        pdf.addPage();
        yPosition = 20;
      }
      
      yPosition += 20;
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('ASSINATURA E RESPONSABILIDADE', 20, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Declaro que as informações contidas neste relatório são verdadeiras e que o veículo', 20, yPosition);
      pdf.text('foi inspecionado conforme os padrões de segurança estabelecidos.', 20, yPosition + 7);
      
      yPosition += 25;
      pdf.line(20, yPosition, 100, yPosition);
      pdf.text('Assinatura do Motorista', 20, yPosition + 7);
      pdf.text(inspectionData.driver_name, 20, yPosition + 15);
      
      pdf.line(120, yPosition, 190, yPosition);
      pdf.text('Assinatura do Inspetor', 120, yPosition + 7);
      pdf.text('NSA - Norte Security Advanced', 120, yPosition + 15);
      
      yPosition += 25;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'italic');
      pdf.text(`Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPosition);
      
      // Save PDF
      const fileName = `NSA_Inspecao_${inspectionData.vehicles.placa}_${createdAt.toLocaleDateString('pt-BR').replace(/\//g, '')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Gerado",
        description: "Relatório baixado com sucesso!"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do relatório",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta inspeção?")) return;

    try {
      const { error } = await supabase
        .from("inspections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Inspeção excluída com sucesso!"
      });
      fetchInspections();
    } catch (error) {
      console.error("Erro ao excluir inspeção:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir inspeção",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Histórico de Inspeções</h1>
              <p className="text-muted-foreground">Consulte o histórico completo de inspeções realizadas</p>
            </div>
          </div>
        </div>

        {/* Filtros de Busca */}
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por motorista, veículo ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              placeholder="Filtrar por data"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setDateFilter("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Relatórios de Inspeção</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : filteredInspections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma inspeção encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell className="font-medium">
                          {formatDate(inspection.created_at)}
                        </TableCell>
                        <TableCell>{inspection.vehicles.marca_modelo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{inspection.vehicles.placa}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={inspection.vehicles.vehicle_type === "carro" ? "default" : "secondary"}>
                            {inspection.vehicles.vehicle_type === "carro" ? (
                              <><Car className="h-3 w-3 mr-1" />Carro</>
                            ) : (
                              <><Bike className="h-3 w-3 mr-1" />Moto</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{inspection.driver_name}</TableCell>
                        <TableCell>{inspection.driver_cpf}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <ReportViewer reportId={inspection.id}>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Visualizar"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </ReportViewer>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadPDF(inspection.id)}
                              title="Download PDF"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(inspection.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default InspectionHistory;