import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChecklistItem, InspectionStatus } from "@/types/inspection";
import { Camera, Check, AlertTriangle, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItemComponentProps {
  item: ChecklistItem;
  onUpdate: (item: ChecklistItem) => void;
}

export default function ChecklistItemComponent({ item, onUpdate }: ChecklistItemComponentProps) {
  const [showObservations, setShowObservations] = useState(false);
  const [observations, setObservations] = useState(item.observations || '');

  const handleStatusChange = (status: InspectionStatus) => {
    const updatedItem = { ...item, status };
    onUpdate(updatedItem);
    
    // Auto-show observations for non-OK status
    if (status !== 'ok') {
      setShowObservations(true);
    }
  };

  const handleObservationsChange = (value: string) => {
    setObservations(value);
    const updatedItem = { ...item, observations: value };
    onUpdate(updatedItem);
  };

  const handlePhotoCapture = () => {
    // TODO: Implement camera functionality
    console.log('Capture photo for:', item.name);
  };

  const getStatusButton = (status: InspectionStatus, label: string, icon: React.ReactNode, variant: any) => (
    <Button
      variant={item.status === status ? variant : 'outline'}
      size="sm"
      className={cn(
        "flex-1 h-12 text-xs font-medium transition-all",
        item.status === status && "ring-2 ring-offset-2"
      )}
      onClick={() => handleStatusChange(status)}
    >
      {icon}
      <span className="ml-1">{label}</span>
    </Button>
  );

  return (
    <Card className="shadow-soft border-l-4 border-l-muted">
      <CardContent className="p-4 space-y-4">
        {/* Item name and photo count */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-foreground leading-tight">{item.name}</h3>
            {item.photos && item.photos.length > 0 && (
              <Badge variant="secondary" className="mt-1">
                {item.photos.length} foto{item.photos.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <Button
            variant="outline"
            size="icon-sm"
            className="ml-3 shrink-0"
            onClick={handlePhotoCapture}
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>

        {/* Status buttons */}
        <div className="grid grid-cols-3 gap-2">
          {getStatusButton('ok', 'OK', <Check className="w-4 h-4" />, 'outline-success')}
          {getStatusButton('needs_replacement', 'Trocar', <AlertTriangle className="w-4 h-4" />, 'outline-warning')}
          {getStatusButton('observation', 'Observar', <MessageSquare className="w-4 h-4" />, 'outline-destructive')}
        </div>

        {/* Observations toggle */}
        {item.status && item.status !== 'ok' && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setShowObservations(!showObservations)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              {showObservations ? 'Ocultar' : 'Adicionar'} observações
            </Button>
            
            {showObservations && (
              <Textarea
                value={observations}
                onChange={(e) => handleObservationsChange(e.target.value)}
                placeholder="Descreva o problema ou observação..."
                className="min-h-[60px] text-sm"
              />
            )}
          </div>
        )}

        {/* Status indicator */}
        {item.status && (
          <div className={cn(
            "h-1 w-full rounded-full",
            item.status === 'ok' && "bg-success",
            item.status === 'needs_replacement' && "bg-warning",
            item.status === 'observation' && "bg-destructive"
          )} />
        )}
      </CardContent>
    </Card>
  );
}