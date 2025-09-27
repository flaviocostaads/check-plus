import { supabase } from "@/integrations/supabase/client";

export interface PDFInspectionData {
  id: string;
  created_at: string;
  driver_name: string;
  driver_cpf: string;
  driver_cnh: string;
  driver_cnh_validade: string;
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

export const generateInspectionPDF = async (inspectionData: PDFInspectionData) => {
  const { default: jsPDF } = await import('jspdf');
  
  // Create new PDF instance
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  try {
    let yPosition = 20;

    // Helper function to add NSA logo
    const addLogo = async () => {
      try {
        // Add NSA logo - we'll use a placeholder for now since we need to convert the image
        pdf.setFillColor(59, 130, 246); // Primary blue color
        pdf.rect(15, 15, 40, 25, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('NSA', 25, 30);
        
        pdf.setFontSize(8);
        pdf.text('NORTE', 18, 35);
        pdf.text('SECURITY', 18, 38);
        pdf.text('ADVANCED', 18, 41);
      } catch (error) {
        console.warn('Could not load logo:', error);
      }
    };

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > 280) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Helper function to load and add image to PDF
    const addImageToPDF = async (imageUrl: string, x: number, y: number, width: number, height: number) => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = function() {
            try {
              const dataUrl = reader.result as string;
              pdf.addImage(dataUrl, 'JPEG', x, y, width, height);
              resolve();
            } catch (error) {
              console.warn('Could not add image to PDF:', error);
              // Add placeholder rectangle instead
              pdf.setDrawColor(200, 200, 200);
              pdf.rect(x, y, width, height, 'S');
              pdf.text('Foto indisponível', x + 2, y + height/2);
              resolve();
            }
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn('Could not load image:', error);
        // Add placeholder
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(x, y, width, height, 'S');
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(8);
        pdf.text('Foto indisponível', x + 2, y + height/2);
      }
    };

    // Add logo
    await addLogo();

    // Company header
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('NORTE SECURITY ADVANCED LTDA', 65, 25);
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text('CNPJ: 41.537.956/0001-04', 65, 32);
    pdf.text('Quadra Aço 90 (901 Sul) Alameda 17, SN - Sala 02 Quadra06 Lote 03', 65, 36);
    pdf.text('Plano Diretor Sul - Palmas/TO - CEP: 77017-266', 65, 40);

    yPosition = 55;

    // Title
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('RELATÓRIO DE INSPEÇÃO VEICULAR', 105, yPosition, { align: 'center' });
    
    yPosition += 10;
    
    // Date and ID
    const createdAt = new Date(inspectionData.created_at);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Data: ${createdAt.toLocaleDateString('pt-BR')} às ${createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 20, yPosition);
    pdf.text(`ID: ${inspectionData.id.slice(0, 8)}`, 150, yPosition);

    yPosition += 15;

    // Vehicle Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('DADOS DO VEÍCULO', 20, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    // Vehicle info in two columns
    const leftCol = 20;
    const rightCol = 110;
    
    pdf.text(`Marca/Modelo: ${inspectionData.vehicles.marca_modelo}`, leftCol, yPosition);
    pdf.text(`Cor: ${inspectionData.vehicles.cor}`, rightCol, yPosition);
    yPosition += 6;
    
    pdf.text(`Placa: ${inspectionData.vehicles.placa}`, leftCol, yPosition);
    pdf.text(`Ano: ${inspectionData.vehicles.ano}`, rightCol, yPosition);
    yPosition += 6;
    
    pdf.text(`Renavam: ${inspectionData.vehicles.renavam}`, leftCol, yPosition);
    pdf.text(`KM Atual: ${inspectionData.vehicles.km_atual || "N/A"}`, rightCol, yPosition);

    yPosition += 15;

    // Driver Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('DADOS DO CONDUTOR', 20, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    pdf.text(`Nome Completo: ${inspectionData.driver_name}`, leftCol, yPosition);
    pdf.text(`CNH: ${inspectionData.driver_cnh}`, rightCol, yPosition);
    yPosition += 6;
    
    pdf.text(`CPF: ${inspectionData.driver_cpf}`, leftCol, yPosition);
    pdf.text(`Validade CNH: ${inspectionData.driver_cnh_validade}`, rightCol, yPosition);

    yPosition += 15;

    // Removed summary section as requested

    // Detailed checklist items
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('ITENS VERIFICADOS DETALHADAMENTE', 20, yPosition);
    yPosition += 8;

    // Process each inspection item
    for (let index = 0; index < inspectionData.inspection_items.length; index++) {
      const item = inspectionData.inspection_items[index];
      
      checkPageBreak(15); // Reduced space needed for an item
      
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      
      const statusText = item.status === 'ok' ? 'OK ✓' : 
                        item.status === 'needs_replacement' ? 'TROCAR ⚠' : 
                        item.status === 'observation' ? 'OBSERVAR 👁' : 'N/A';
      
      pdf.text(`${index + 1}. ${item.checklist_templates.name}`, leftCol, yPosition);
      pdf.text(statusText, 140, yPosition); // Removed "Status:" label
      yPosition += 5;
      
      // Observations
      if (item.observations) {
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        const maxWidth = 170;
        const splitObs = pdf.splitTextToSize(`Observações: ${item.observations}`, maxWidth);
        pdf.text(splitObs, leftCol + 5, yPosition);
        yPosition += splitObs.length * 3 + 1;
      }
      
      yPosition += 4; // Reduced space between items
    }

    // Damage markers section
    if (inspectionData.damage_markers && inspectionData.damage_markers.length > 0) {
      checkPageBreak(40);
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('AVARIAS IDENTIFICADAS', 20, yPosition);
      yPosition += 10;
      
      inspectionData.damage_markers.forEach((damage, index) => {
        checkPageBreak(25);
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Dano ${index + 1}:`, leftCol, yPosition);
        yPosition += 5;
        
        pdf.setFont(undefined, 'normal');
        const maxWidth = 170;
        const splitDesc = pdf.splitTextToSize(`Posição: X: ${damage.x_position}, Y: ${damage.y_position}`, maxWidth);
        pdf.text(splitDesc, leftCol + 5, yPosition);
        yPosition += splitDesc.length * 4;
        
        const splitDamageDesc = pdf.splitTextToSize(`Descrição: ${damage.description}`, maxWidth);
        pdf.text(splitDamageDesc, leftCol + 5, yPosition);
        yPosition += splitDamageDesc.length * 4 + 5;
      });
    }

    // Signatures section
    checkPageBreak(80);
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('ASSINATURAS', 20, yPosition);
    yPosition += 15;

    // Driver signature
    if (inspectionData.signature_data) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Assinatura do Condutor', leftCol, yPosition);
      yPosition += 5;
      
      try {
        await addImageToPDF(inspectionData.signature_data, leftCol, yPosition, 80, 25);
      } catch (error) {
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(leftCol, yPosition, 80, 25, 'S');
      }
      
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Assinado por: ${inspectionData.driver_name}`, leftCol, yPosition + 30);
    }

    // Inspector signature
    if (inspectionData.inspector_signature_data) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Assinatura do Inspetor', rightCol, yPosition);
      
      try {
        await addImageToPDF(inspectionData.inspector_signature_data, rightCol, yPosition + 5, 80, 25);
      } catch (error) {
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(rightCol, yPosition + 5, 80, 25, 'S');
      }
      
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text('NSA - Norte Security Advanced', rightCol, yPosition + 35);
    }

    yPosition += 50;

    // Declaration
    checkPageBreak(25);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Declaro que as informações contidas neste relatório são verdadeiras e que o veículo', 20, yPosition);
    pdf.text('foi inspecionado conforme os padrões de segurança estabelecidos.', 20, yPosition + 5);

    yPosition += 20;

    // Footer
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPosition);

    // Save PDF
    const fileName = `NSA_Inspecao_${inspectionData.vehicles.placa}_${createdAt.toLocaleDateString('pt-BR').replace(/\//g, '')}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Erro ao gerar PDF do relatório');
  }
};