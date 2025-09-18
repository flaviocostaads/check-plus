import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Share, Download, Mail } from "lucide-react";
import { InspectionData } from "@/types/inspection";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface ReportGeneratorProps {
  inspection: InspectionData;
  onShare?: (method: 'whatsapp' | 'email') => void;
}

export default function ReportGenerator({ inspection, onShare }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF();
      
      // Header with company logo
      pdf.setFontSize(20);
      pdf.text('NSA - RELATÓRIO DE INSPEÇÃO VEICULAR', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`Data: ${inspection.createdAt.toLocaleDateString('pt-BR')}`, 20, 45);
      pdf.text(`ID: ${inspection.id}`, 20, 55);
      
      // Vehicle info
      pdf.setFontSize(14);
      pdf.text('DADOS DO VEÍCULO', 20, 75);
      pdf.setFontSize(10);
      pdf.text(`Marca/Modelo: ${inspection.vehicleData.marca_modelo}`, 20, 85);
      pdf.text(`Placa: ${inspection.vehicleData.placa}`, 20, 95);
      pdf.text(`Cor: ${inspection.vehicleData.cor}`, 100, 95);
      pdf.text(`Ano: ${inspection.vehicleData.ano}`, 20, 105);
      pdf.text(`Renavam: ${inspection.vehicleData.renavam}`, 100, 105);
      pdf.text(`KM Atual: ${inspection.vehicleData.km_atual}`, 20, 115);
      
      // Driver info
      pdf.setFontSize(14);
      pdf.text('DADOS DO CONDUTOR', 20, 135);
      pdf.setFontSize(10);
      pdf.text(`Nome: ${inspection.driverData.nome_completo}`, 20, 145);
      pdf.text(`CPF: ${inspection.driverData.cpf}`, 20, 155);
      pdf.text(`CNH: ${inspection.driverData.cnh_numero}`, 100, 155);
      pdf.text(`Validade CNH: ${inspection.driverData.cnh_validade}`, 20, 165);
      
      // Checklist items
      pdf.setFontSize(14);
      pdf.text('ITENS VERIFICADOS', 20, 185);
      
      let yPosition = 195;
      inspection.checklistItems.forEach((item, index) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(10);
        const status = item.status === 'ok' ? 'OK' : 
                      item.status === 'needs_replacement' ? 'TROCAR' : 
                      item.status === 'observation' ? 'OBSERVAR' : 'N/A';
        
        pdf.text(`${index + 1}. ${item.name}: ${status}`, 20, yPosition);
        
        if (item.observations) {
          yPosition += 8;
          pdf.setFontSize(8);
          pdf.text(`   Obs: ${item.observations}`, 25, yPosition);
          pdf.setFontSize(10);
        }
        
        yPosition += 10;
      });
      
      // Signature area
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(12);
      pdf.text('ASSINATURA DO MOTORISTA', 20, yPosition + 20);
      pdf.line(20, yPosition + 40, 100, yPosition + 40);
      pdf.setFontSize(10);
      pdf.text(inspection.driverData.nome_completo, 20, yPosition + 50);
      
      // Save PDF
      const fileName = `NSA_Inspecao_${inspection.vehicleData.placa}_${inspection.createdAt.toLocaleDateString('pt-BR').replace(/\//g, '')}.pdf`;
      pdf.save(fileName);
      
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
    }
    
    setIsGenerating(false);
  };

  const shareWhatsApp = () => {
    const message = `*NSA - Relatório de Inspeção*\n\n` +
      `🚗 Veículo: ${inspection.vehicleData.marca_modelo}\n` +
      `🔢 Placa: ${inspection.vehicleData.placa}\n` +
      `👤 Condutor: ${inspection.driverData.nome_completo}\n` +
      `📅 Data: ${inspection.createdAt.toLocaleDateString('pt-BR')}\n\n` +
      `✅ Itens OK: ${inspection.checklistItems.filter(i => i.status === 'ok').length}\n` +
      `⚠️ Observações: ${inspection.checklistItems.filter(i => i.status === 'observation').length}\n` +
      `🔧 Trocar: ${inspection.checklistItems.filter(i => i.status === 'needs_replacement').length}\n\n` +
      `Relatório completo em PDF será enviado separadamente.`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onShare?.('whatsapp');
  };

  const shareEmail = () => {
    const subject = `NSA - Relatório de Inspeção - ${inspection.vehicleData.placa}`;
    const body = `Segue relatório de inspeção do veículo ${inspection.vehicleData.marca_modelo} (${inspection.vehicleData.placa}) realizada em ${inspection.createdAt.toLocaleDateString('pt-BR')}.`;
    
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
    onShare?.('email');
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Gerar Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Resumo da Inspeção</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {inspection.checklistItems.filter(i => i.status === 'ok').length}
              </div>
              <div className="text-muted-foreground">OK</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {inspection.checklistItems.filter(i => i.status === 'needs_replacement').length}
              </div>
              <div className="text-muted-foreground">Trocar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {inspection.checklistItems.filter(i => i.status === 'observation').length}
              </div>
              <div className="text-muted-foreground">Observar</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <Button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={shareWhatsApp}
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Share className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            
            <Button 
              onClick={shareEmail}
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}