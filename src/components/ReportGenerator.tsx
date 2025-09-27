import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Share, Download, Mail } from "lucide-react";
import { InspectionData } from "@/types/inspection";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import nsaLogo from "@/assets/nsa-logo.jpg";

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
      
      // Add NSA logo
      const img = new Image();
      img.onload = () => {
        // Company header with logo
        pdf.addImage(img, 'JPEG', 20, 10, 40, 20);
        
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('NORTE SECURITY ADVANCED LTDA', 70, 20);
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text('CNPJ: 41.537.956/0001-04', 70, 27);
        pdf.text('Quadra Aço 90 (901 Sul) Alameda 17, SN - Sala 02 Quadra06 Lote 03', 70, 32);
        pdf.text('Plano Diretor Sul - Palmas/TO - CEP: 77017-266', 70, 37);
        
        // Title
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.text('RELATÓRIO DE INSPEÇÃO VEICULAR', 20, 50);
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Data: ${inspection.createdAt.toLocaleDateString('pt-BR')} às ${inspection.createdAt.toLocaleTimeString('pt-BR')}`, 20, 60);
        pdf.text(`ID: ${inspection.id.slice(0, 8)}`, 120, 60);
        
        // Continue with rest of PDF generation
        generatePDFContent(pdf);
      };
      img.src = nsaLogo;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
      setIsGenerating(false);
    }
  };

  const generatePDFContent = (pdf: jsPDF) => {
    try {
      // Vehicle info section
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('DADOS DO VEÍCULO', 20, 75);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Marca/Modelo: ${inspection.vehicleData.marca_modelo}`, 20, 85);
      pdf.text(`Placa: ${inspection.vehicleData.placa}`, 20, 92);
      pdf.text(`Cor: ${inspection.vehicleData.cor}`, 100, 85);
      pdf.text(`Ano: ${inspection.vehicleData.ano}`, 100, 92);
      pdf.text(`Renavam: ${inspection.vehicleData.renavam}`, 20, 99);
      pdf.text(`KM Atual: ${inspection.vehicleData.km_atual}`, 100, 99);
      // Driver info section
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('DADOS DO CONDUTOR', 20, 115);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nome Completo: ${inspection.driverData.nome_completo}`, 20, 125);
      pdf.text(`CPF: ${inspection.driverData.cpf}`, 20, 132);
      pdf.text(`CNH: ${inspection.driverData.cnh_numero}`, 100, 125);
      pdf.text(`Validade CNH: ${inspection.driverData.cnh_validade}`, 100, 132);
      // Summary section
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('RESUMO DA INSPEÇÃO', 20, 150);
      
      const summary = {
        ok: inspection.checklistItems.filter(i => i.status === 'ok').length,
        needs_replacement: inspection.checklistItems.filter(i => i.status === 'needs_replacement').length,
        observation: inspection.checklistItems.filter(i => i.status === 'observation').length
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
      inspection.checklistItems.forEach((item, index) => {
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        const status = item.status === 'ok' ? 'OK ✓' : 
                      item.status === 'needs_replacement' ? 'TROCAR ⚠' : 
                      item.status === 'observation' ? 'OBSERVAR 👁' : 'N/A';
        
        pdf.text(`${index + 1}. ${item.name}`, 20, yPosition);
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
        
        if (item.photos && item.photos.length > 0) {
          yPosition += 5;
          pdf.setFontSize(8);
          pdf.setFont(undefined, 'italic');
          pdf.text(`Fotos anexadas: ${item.photos.length} foto(s)`, 25, yPosition);
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
      pdf.text(inspection.driverData.nome_completo, 20, yPosition + 15);
      
      pdf.line(120, yPosition, 190, yPosition);
      pdf.text('Assinatura do Inspetor', 120, yPosition + 7);
      pdf.text('NSA - Norte Security Advanced', 120, yPosition + 15);
      
      yPosition += 25;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'italic');
      pdf.text(`Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPosition);
      
      // Save PDF
      const fileName = `NSA_Inspecao_${inspection.vehicleData.placa}_${inspection.createdAt.toLocaleDateString('pt-BR').replace(/\//g, '')}.pdf`;
      pdf.save(fileName);
      
      toast.success('Relatório PDF gerado com sucesso!');
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
      setIsGenerating(false);
    }
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