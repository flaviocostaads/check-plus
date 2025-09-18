import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, X, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CameraCaptureProps {
  onPhotoCapture: (photoUrl: string) => void;
  itemName: string;
}

export default function CameraCapture({ onPhotoCapture, itemName }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Erro ao acessar câmera");
      console.error("Camera access error:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
    stopCamera();
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      toast.success("Foto capturada com sucesso!");
      setIsOpen(false);
      setCapturedPhoto(null);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="shrink-0"
          onClick={startCamera}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Foto: {itemName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!capturedPhoto ? (
            <>
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleClose} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button onClick={capturePhoto} className="bg-primary">
                  <Camera className="w-4 h-4 mr-1" />
                  Capturar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                <img
                  src={capturedPhoto}
                  alt="Foto capturada"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={retakePhoto} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Nova Foto
                </Button>
                <Button onClick={confirmPhoto} className="bg-success">
                  <Check className="w-4 h-4 mr-1" />
                  Confirmar
                </Button>
              </div>
            </>
          )}
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}