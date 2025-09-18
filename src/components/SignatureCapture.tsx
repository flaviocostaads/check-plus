import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, RotateCcw, Check } from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';
import { toast } from "sonner";

interface SignatureCaptureProps {
  onSignatureCapture: (signatureData: string) => void;
  driverName: string;
}

export default function SignatureCapture({ onSignatureCapture, driverName }: SignatureCaptureProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Por favor, faça sua assinatura antes de continuar");
      return;
    }

    const signatureData = sigCanvas.current?.toDataURL();
    if (signatureData) {
      onSignatureCapture(signatureData);
      toast.success("Assinatura capturada com sucesso!");
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenTool className="w-5 h-5" />
          Assinatura do Motorista
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {driverName}, por favor assine no campo abaixo para confirmar a inspeção
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-2 bg-background">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: 'w-full h-32 bg-white rounded cursor-crosshair',
              width: 400,
              height: 128
            }}
            backgroundColor="white"
            penColor="black"
            onBegin={handleBegin}
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button 
            onClick={clearSignature} 
            variant="outline" 
            size="sm"
            disabled={isEmpty}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Limpar
          </Button>
          <Button 
            onClick={saveSignature} 
            className="bg-success"
            disabled={isEmpty}
          >
            <Check className="w-4 h-4 mr-1" />
            Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}