export type VehicleType = 'car' | 'moto';

export type InspectionStatus = 'ok' | 'needs_replacement' | 'observation';

export interface VehicleData {
  marca_modelo: string;
  placa: string;
  cor: string;
  ano: string;
  renavam: string;
  km_atual: string;
}

export interface DriverData {
  nome_completo: string;
  cpf: string;
  cnh_numero: string;
  cnh_validade: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  status?: InspectionStatus;
  observations?: string;
  photos?: string[];
}

export interface InspectionData {
  id: string;
  vehicleType: VehicleType;
  vehicleData: VehicleData;
  driverData: DriverData;
  checklistItems: ChecklistItem[];
  damageMarkers?: DamageMarker[];
  signature?: string;
  inspectorSignature?: string;
  createdAt: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface DamageMarker {
  id: string;
  x: number;
  y: number;
  description: string;
  photos?: string[];
}

// Checklist definitions based on the provided documents
export const CAR_CHECKLIST_ITEMS: Omit<ChecklistItem, 'status' | 'observations' | 'photos'>[] = [
  { id: 'pneus', name: 'Pneus (dianteiros/traseiros)' },
  { id: 'freios', name: 'Freios (pastilhas, discos, fluido)' },
  { id: 'suspensao', name: 'Suspensão (dianteira/traseira)' },
  { id: 'oleo_motor', name: 'Óleo do motor' },
  { id: 'oleo_cambio', name: 'Óleo de câmbio/diferencial' },
  { id: 'agua_radiador', name: 'Água do radiador (arrefecimento)' },
  { id: 'fluido_direcao', name: 'Fluído de direção hidráulica' },
  { id: 'fluido_limpador', name: 'Fluído do limpador de para-brisa' },
  { id: 'farois', name: 'Faróis (alto/baixo)' },
  { id: 'lanternas', name: 'Lanternas traseiras' },
  { id: 'setas', name: 'Setas (dianteiras/traseiras)' },
  { id: 'luz_freio', name: 'Luz de freio' },
  { id: 'luz_re', name: 'Luz de ré' },
  { id: 'buzina', name: 'Buzina' },
  { id: 'retrovisores', name: 'Retrovisores' },
  { id: 'painel', name: 'Painel de instrumentos' },
  { id: 'cinto_seguranca', name: 'Cinto de segurança' },
  { id: 'estepe', name: 'Estepe (pneu reserva)' },
  { id: 'macaco_chave', name: 'Macaco e chave de roda' },
  { id: 'triangulo', name: 'Triângulo de sinalização' },
  { id: 'extintor', name: 'Extintor de incêndio (validade)' },
  { id: 'documentacao', name: 'Documentação (CRLV, seguro)' },
  { id: 'chave_reserva', name: 'Chave reserva' },
];

export const MOTO_CHECKLIST_ITEMS: Omit<ChecklistItem, 'status' | 'observations' | 'photos'>[] = [
  { id: 'pneus', name: 'Pneus dianteiro/traseiro' },
  { id: 'freios', name: 'Freios (pastilhas e disco)' },
  { id: 'suspensao', name: 'Suspensão dianteira/traseira' },
  { id: 'oleo_motor', name: 'Óleo do motor' },
  { id: 'combustivel', name: 'Nível do combustível' },
  { id: 'farol', name: 'Farol dianteiro/traseiro' },
  { id: 'setas', name: 'Setas' },
  { id: 'buzina', name: 'Buzina' },
  { id: 'espelhos', name: 'Espelhos' },
  { id: 'retrovisores', name: 'Retrovisores' },
  { id: 'painel', name: 'Painel de instrumentos' },
  { id: 'corrente_coroa', name: 'Corrente e Coroa' },
  { id: 'chave_reserva', name: 'Chave reserva' },
  { id: 'documentacao', name: 'Documentação (CRLV)' },
];