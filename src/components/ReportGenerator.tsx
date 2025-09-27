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
      img.onload = async () => {
        // Header with background
        pdf.setFillColor(41, 128, 185); // Professional blue
        pdf.rect(0, 0, 210, 35, 'F');
        
        // Company logo
        pdf.addImage(img, 'JPEG', 15, 8, 25, 18);
        
        // Company header
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('NORTE SECURITY ADVANCED LTDA', 45, 16);
        
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.text('CNPJ: 41.537.956/0001-04', 45, 22);
        pdf.text('Quadra Aço 90 (901 Sul) Alameda 17, SN - Sala 02', 45, 26);
        pdf.text('Plano Diretor Sul - Palmas/TO - CEP: 77017-266', 45, 30);
        
        // Reset text color
        pdf.setTextColor(0, 0, 0);
        
        // Title with decorative line
        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        pdf.text('RELATÓRIO DE INSPEÇÃO VEICULAR', 20, 50);
        
        pdf.setLineWidth(2);
        pdf.setDrawColor(41, 128, 185);
        pdf.line(20, 55, 190, 55);
        
        // Date and ID info
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Data: ${inspection.createdAt.toLocaleDateString('pt-BR')} às ${inspection.createdAt.toLocaleTimeString('pt-BR')}`, 20, 65);
        pdf.text(`ID da Inspeção: ${inspection.id.slice(0, 8)}`, 120, 65);
        
        // Continue with rest of PDF generation
        await generatePDFContent(pdf);
      };
      img.src = nsaLogo;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
      setIsGenerating(false);
    }
  };

  const generatePDFContent = async (pdf: jsPDF) => {
    try {
      // Vehicle info section with background
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, 72, 180, 30, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(41, 128, 185);
      pdf.text('DADOS DO VEÍCULO', 20, 82);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Marca/Modelo: ${inspection.vehicleData.marca_modelo}`, 20, 90);
      pdf.text(`Cor: ${inspection.vehicleData.cor}`, 110, 90);
      pdf.text(`Placa: ${inspection.vehicleData.placa}`, 20, 96);
      pdf.text(`Ano: ${inspection.vehicleData.ano}`, 110, 96);
      
      // Driver info section
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, 108, 180, 25, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(41, 128, 185);
      pdf.text('DADOS DO CONDUTOR', 20, 118);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nome Completo: ${inspection.driverData.nome_completo}`, 20, 126);
      pdf.text(`CNH: ${inspection.driverData.cnh_numero}`, 110, 126);
      
      // Summary section with colored boxes
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(41, 128, 185);
      pdf.text('RESUMO DA INSPEÇÃO', 20, 150);
      
      const summary = {
        ok: inspection.checklistItems.filter(i => i.status === 'ok').length,
        needs_replacement: inspection.checklistItems.filter(i => i.status === 'needs_replacement').length,
        observation: inspection.checklistItems.filter(i => i.status === 'observation').length
      };
      
      // OK items box
      pdf.setFillColor(46, 204, 113);
      pdf.rect(25, 155, 45, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${summary.ok}`, 47, 167);
      pdf.setFontSize(8);
      pdf.text('ITENS OK', 40, 172);
      
      // Needs replacement box
      pdf.setFillColor(231, 76, 60);
      pdf.rect(80, 155, 45, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${summary.needs_replacement}`, 102, 167);
      pdf.setFontSize(8);
      pdf.text('TROCAR', 95, 172);
      
      // Observation box
      pdf.setFillColor(241, 196, 15);
      pdf.rect(135, 155, 45, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${summary.observation}`, 157, 167);
      pdf.setFontSize(8);
      pdf.text('OBSERVAR', 147, 172);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Checklist items
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(41, 128, 185);
      pdf.text('ITENS VERIFICADOS DETALHADAMENTE', 20, 190);
      
      pdf.setTextColor(0, 0, 0);
      let yPosition = 200;
      
      for (let i = 0; i < inspection.checklistItems.length; i++) {
        const item = inspection.checklistItems[i];
        
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        // Item background
        const bgColor = item.status === 'ok' ? [232, 245, 233] : 
                       item.status === 'needs_replacement' ? [255, 235, 238] : 
                       item.status === 'observation' ? [255, 248, 225] : [245, 245, 245];
        
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(15, yPosition - 5, 180, 15, 'F');
        
        // Status indicator
        const statusColor = item.status === 'ok' ? [46, 204, 113] : 
                           item.status === 'needs_replacement' ? [231, 76, 60] : 
                           item.status === 'observation' ? [241, 196, 15] : [128, 128, 128];
        
        pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.rect(15, yPosition - 5, 5, 15, 'F');
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${i + 1}. ${item.name}`, 25, yPosition);
        
        const statusText = item.status === 'ok' ? 'OK ✓' : 
                          item.status === 'needs_replacement' ? 'TROCAR ⚠' : 
                          item.status === 'observation' ? 'OBSERVAR 👁' : 'N/A';
        
        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.text(statusText, 155, yPosition);
        pdf.setTextColor(0, 0, 0);
        
        yPosition += 8;
        
        if (item.observations) {
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(100, 100, 100);
          const maxWidth = 165;
          const splitObs = pdf.splitTextToSize(`Obs: ${item.observations}`, maxWidth);
          pdf.text(splitObs, 25, yPosition);
          yPosition += splitObs.length * 4;
          pdf.setTextColor(0, 0, 0);
        }
        
        // Add photos if they exist
        if (item.photos && item.photos.length > 0) {
          yPosition += 5;
          
          for (let j = 0; j < item.photos.length; j++) {
            const photo = item.photos[j];
            
            try {
              if (yPosition > 220) {
                pdf.addPage();
                yPosition = 30;
              }
              
              // Create image element to load the photo
              const photoImg = new Image();
              photoImg.crossOrigin = "anonymous";
              
              await new Promise((resolve, reject) => {
                photoImg.onload = () => {
                  try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate dimensions maintaining aspect ratio
                    const maxWidth = 80;
                    const maxHeight = 60;
                    
                    let { width, height } = photoImg;
                    const aspectRatio = width / height;
                    
                    if (width > maxWidth) {
                      width = maxWidth;
                      height = width / aspectRatio;
                    }
                    if (height > maxHeight) {
                      height = maxHeight;
                      width = height * aspectRatio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(photoImg, 0, 0, width, height);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    pdf.addImage(dataUrl, 'JPEG', 25, yPosition, width, height);
                    
                    pdf.setFontSize(8);
                    pdf.setFont(undefined, 'italic');
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(`Foto ${j + 1}/${item.photos.length}`, 25, yPosition + height + 5);
                    pdf.setTextColor(0, 0, 0);
                    
                    resolve(null);
                  } catch (err) {
                    resolve(null); // Continue even if image fails
                  }
                };
                photoImg.onerror = () => resolve(null); // Continue even if image fails to load
                photoImg.src = photo;
              });
              
              yPosition += 70; // Space for image + caption
            } catch (err) {
              // If image loading fails, just show text
              pdf.setFontSize(8);
              pdf.setFont(undefined, 'italic');
              pdf.setTextColor(150, 150, 150);
              pdf.text(`[Foto ${j + 1}: Não foi possível carregar]`, 25, yPosition);
              pdf.setTextColor(0, 0, 0);
              yPosition += 8;
            }
          }
        }
        
        yPosition += 10;
      }
      
      // Signature area
      if (yPosition > 220) {
        pdf.addPage();
        yPosition = 30;
      } else {
        yPosition += 20;
      }
      
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPosition, 180, 50, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(41, 128, 185);
      pdf.text('ASSINATURA E RESPONSABILIDADE', 20, yPosition + 10);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text('Declaro que as informações contidas neste relatório são verdadeiras e que', 20, yPosition + 20);
      pdf.text('o veículo foi inspecionado conforme os padrões de segurança estabelecidos.', 20, yPosition + 25);
      
      // Signature lines
      yPosition += 35;
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(100, 100, 100);
      pdf.line(20, yPosition, 90, yPosition);
      pdf.line(105, yPosition, 175, yPosition);
      
      pdf.setFontSize(8);
      pdf.text('Assinatura do Motorista', 20, yPosition + 5);
      pdf.text('Assinatura do Inspetor', 105, yPosition + 5);
      
      pdf.setFont(undefined, 'bold');
      pdf.text(inspection.driverData.nome_completo, 20, yPosition + 10);
      pdf.text('NSA - Norte Security Advanced', 105, yPosition + 10);
      
      // Footer
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPosition + 20);
      
      // Save PDF
      const fileName = `NSA_Inspecao_${inspection.vehicleData.placa}_${inspection.createdAt.toLocaleDateString('pt-BR').replace(/\//g, '')}_${Math.floor(Math.random() * 1000)}.pdf`;
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