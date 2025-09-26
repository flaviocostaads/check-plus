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
      console.log('Iniciando câmera...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Start with more permissive constraints and fallback if needed
      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      };

      let stream = null;
      
      try {
        console.log('Tentando câmera traseira...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.log('Câmera traseira falhou, tentando qualquer câmera...', error);
        // Fallback to any available camera
        constraints = {
          video: true
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      if (videoRef.current && stream) {
        console.log('Configurando video element...');
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        let metadataLoaded = false;
        let streamingStarted = false;
        
        // Create multiple fallback strategies
        const startVideoPlayback = async () => {
          if (streamingStarted || !videoRef.current) return;
          
          try {
            console.log('Tentando iniciar reprodução do vídeo...');
            
            // Force video properties
            videoRef.current.muted = true;
            videoRef.current.playsInline = true;
            videoRef.current.autoplay = true;
            
            await videoRef.current.play();
            console.log('Vídeo reproduzindo com sucesso');
            
            // Wait a bit and check video dimensions
            setTimeout(() => {
              if (videoRef.current && videoRef.current.videoWidth > 0) {
                console.log(`Dimensões do vídeo: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                streamingStarted = true;
                setIsStreaming(true);
              } else {
                console.log('Vídeo ainda sem dimensões, tentando novamente...');
                // Force streaming even without proper dimensions
                streamingStarted = true;
                setIsStreaming(true);
              }
            }, 500);
            
          } catch (playError) {
            console.error('Erro ao iniciar reprodução:', playError);
            // Even if play fails, try to show the stream
            console.log('Forçando exibição do stream mesmo com erro de reprodução');
            streamingStarted = true;
            setIsStreaming(true);
          }
        };
        
        // Primary method: wait for metadata
        videoRef.current.onloadedmetadata = () => {
          console.log('Metadata carregado');
          metadataLoaded = true;
          startVideoPlayback();
        };
        
        // Fallback 1: Force start after 2 seconds if metadata doesn't load
        setTimeout(() => {
          if (!metadataLoaded && !streamingStarted) {
            console.log('Fallback: Metadata não carregou em 2s, forçando início');
            startVideoPlayback();
          }
        }, 2000);
        
        // Fallback 2: Ultimate fallback after 5 seconds
        setTimeout(() => {
          if (!streamingStarted) {
            console.log('Fallback final: Forçando streaming após 5s');
            streamingStarted = true;
            setIsStreaming(true);
          }
        }, 5000);
        
        // Additional events that might help
        videoRef.current.oncanplay = () => {
          console.log('Vídeo pode ser reproduzido');
          if (!streamingStarted) {
            startVideoPlayback();
          }
        };
        
        videoRef.current.onloadeddata = () => {
          console.log('Dados do vídeo carregados');
          if (!streamingStarted) {
            startVideoPlayback();
          }
        };
        
        // Try to start immediately
        setTimeout(() => {
          startVideoPlayback();
        }, 100);
      }
    } catch (error: any) {
      console.error("Erro ao acessar câmera:", error);
      let errorMessage = "Erro ao acessar a câmera";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permissão da câmera negada. Verifique as configurações do navegador e permita o acesso à câmera.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Câmera não encontrada neste dispositivo.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Câmera está sendo usada por outro aplicativo.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "As configurações da câmera não são suportadas por este dispositivo.";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Acesso à câmera bloqueado por questões de segurança. Certifique-se de que está usando HTTPS.";
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
    if (!videoRef.current || !isStreaming) {
      toast.error("Câmera não está ativa");
      return;
    }

    try {
      console.log('Capturando foto...');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Não foi possível criar contexto do canvas');
      }

      // Wait for video to have dimensions
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        toast.error("Aguarde a câmera carregar completamente");
        return;
      }

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Foto capturada com sucesso');
      setCapturedPhoto(dataUrl);
      stopCamera();
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      toast.error("Erro ao capturar foto. Tente novamente.");
    }
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
                <div className="space-y-2">
                  <Button onClick={startCamera} className="btn-touch w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar Câmera
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Certifique-se de permitir o acesso à câmera quando solicitado
                  </p>
                </div>
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