import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, Image as ImageIcon, Check, X, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OdometerCaptureProps {
  onOdometerCapture: (km: string, photoUrl: string) => void;
  initialKm?: string;
}

export const OdometerCapture = ({ onOdometerCapture, initialKm = "" }: OdometerCaptureProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [kmValue, setKmValue] = useState(initialKm);
  const [uploading, setUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Request camera permissions with fallback options
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error: any) {
      console.error("Erro ao acessar câmera:", error);
      let errorMessage = "Erro ao acessar a câmera";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permissão da câmera negada. Verifique as configurações do navegador.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Câmera não encontrada neste dispositivo.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Câmera está sendo usada por outro aplicativo.";
      }
      
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    context.drawImage(videoRef.current, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const uploadPhoto = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      fetch(dataUrl)
        .then(res => res.blob())
        .then(async (blob) => {
          const file = new File([blob], `odometer-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          const fileName = `odometer-${Date.now()}-${Math.random()}.jpg`;
          const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('odometer-photos')
        .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('odometer-photos')
            .getPublicUrl(filePath);

          resolve(publicUrl);
        })
        .catch(reject);
    });
  };

  const confirmPhoto = async () => {
    if (!capturedPhoto || !kmValue.trim()) {
      toast.error("Informe o valor do KM");
      return;
    }

    setUploading(true);
    try {
      const photoUrl = await uploadPhoto(capturedPhoto);
      onOdometerCapture(kmValue, photoUrl);
      toast.success("Odômetro registrado com sucesso!");
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar foto:", error);
      toast.error("Erro ao salvar foto do odômetro");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    setKmValue(initialKm);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open) {
        setIsOpen(true);
      } else {
        handleClose();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          <Camera className="h-4 w-4 mr-2" />
          Fotografar Odômetro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Registrar KM do Odômetro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="km" className="text-sm sm:text-base">Quilometragem Atual</Label>
            <Input
              id="km"
              type="number"
              value={kmValue}
              onChange={(e) => setKmValue(e.target.value)}
              placeholder="Ex: 123456"
              className="h-12 btn-touch text-base"
            />
          </div>

          <div className="space-y-3">
            <Label>Foto do Odômetro</Label>
            
            {!isStreaming && !capturedPhoto && (
              <div className="text-center">
                <div className="bg-muted rounded-lg p-8 mb-3">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Tire uma foto do odômetro para comprovar a quilometragem
                  </p>
                </div>
                <Button onClick={startCamera} className="btn-touch">
                  <Camera className="h-4 w-4 mr-2" />
                  Iniciar Câmera
                </Button>
              </div>
            )}

            {isStreaming && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg"
                />
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-24 border-2 border-primary border-dashed rounded-lg"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <Button onClick={capturePhoto} size="lg" className="rounded-full btn-touch">
                    <Camera className="h-5 w-5" />
                  </Button>
                  <Button onClick={stopCamera} variant="outline" size="lg" className="rounded-full btn-touch">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {capturedPhoto && (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={capturedPhoto}
                    alt="Foto do odômetro"
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={confirmPhoto} 
                    disabled={uploading || !kmValue.trim()}
                    className="flex-1 btn-touch"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {uploading ? "Salvando..." : "Confirmar"}
                  </Button>
                  <Button onClick={retakePhoto} variant="outline" className="btn-touch">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Repetir
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OdometerCapture;