import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  MessageSquare, 
  Cloud, 
  Webhook, 
  Code, 
  Copy,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function IntegrationDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative">
      <div className="absolute top-2 right-2 flex gap-2">
        <Badge variant="outline" className="text-xs">{language}</Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => copyToClipboard(code, id)}
        >
          {copiedCode === id ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-primary to-primary-glow p-2 rounded-xl">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Documentação de Integrações</h2>
          <p className="text-muted-foreground">
            Guia completo para configurar todas as integrações disponíveis
          </p>
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="drive" className="gap-2">
            <Cloud className="h-4 w-4" />
            Google Drive
          </TabsTrigger>
          <TabsTrigger value="webhook" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Code className="h-4 w-4" />
            API REST
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                WhatsApp Business API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Pré-requisitos</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Conta WhatsApp Business API</li>
                  <li>Token de acesso do WhatsApp Business</li>
                  <li>Número de telefone verificado</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Passo 1: Obter Credenciais</h3>
                <p className="text-muted-foreground">
                  Acesse o Facebook Business Manager e copie suas credenciais:
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Facebook Business
                  </a>
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Passo 2: Configurar no Sistema</h3>
                <CodeBlock
                  id="whatsapp-config"
                  language="json"
                  code={`{
  "access_token": "SEU_TOKEN_DE_ACESSO",
  "phone_number_id": "SEU_PHONE_NUMBER_ID",
  "webhook_verify_token": "TOKEN_PERSONALIZADO"
}`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Funcionalidades</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Notificações automáticas de inspeções</li>
                  <li>Lembretes de vencimento de CNH para motoristas</li>
                  <li>Envio de relatórios em PDF via WhatsApp</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Drive */}
        <TabsContent value="drive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Google Drive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Passo 1: Criar Projeto Google Cloud</h3>
                <p className="text-muted-foreground">
                  Crie um projeto e habilite a API do Google Drive:
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Google Cloud Console
                  </a>
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Passo 2: Configurar OAuth 2.0</h3>
                <CodeBlock
                  id="drive-config"
                  language="json"
                  code={`{
  "client_id": "SEU_CLIENT_ID.apps.googleusercontent.com",
  "client_secret": "SEU_CLIENT_SECRET",
  "redirect_uri": "https://seu-dominio.com/oauth/google/callback",
  "folder_id": "ID_DA_PASTA_PRINCIPAL"
}`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Estrutura de Pastas Recomendada</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm">
{`NSA Checklist/
├── Inspeções/
│   ├── 2025/
│   │   ├── Janeiro/
│   │   └── Fevereiro/
├── Veículos/
│   ├── Fotos/
│   └── Documentos/
└── Motoristas/
    └── Documentos/`}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Funcionalidades</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Backup automático de PDFs de inspeção</li>
                  <li>Armazenamento organizado de fotos</li>
                  <li>Sincronização em tempo real</li>
                  <li>Compartilhamento fácil de relatórios</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Eventos Disponíveis</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="outline">inspection.created</Badge>
                  <Badge variant="outline">inspection.updated</Badge>
                  <Badge variant="outline">inspection.completed</Badge>
                  <Badge variant="outline">vehicle.created</Badge>
                  <Badge variant="outline">vehicle.updated</Badge>
                  <Badge variant="outline">driver.created</Badge>
                  <Badge variant="outline">driver.updated</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Configuração</h3>
                <CodeBlock
                  id="webhook-config"
                  language="json"
                  code={`{
  "url": "https://seu-servidor.com/webhook/nsa",
  "secret": "CHAVE_SECRETA_COMPARTILHADA",
  "events": [
    "inspection.created",
    "inspection.completed",
    "vehicle.created"
  ],
  "active": true
}`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Payload de Exemplo</h3>
                <CodeBlock
                  id="webhook-payload"
                  language="json"
                  code={`{
  "event": "inspection.completed",
  "timestamp": "2025-01-20T11:45:00Z",
  "data": {
    "inspection_id": "123e4567-e89b-12d3-a456",
    "vehicle": {
      "marca_modelo": "Volkswagen Gol",
      "placa": "ABC-1234"
    },
    "driver": {
      "nome_completo": "João Silva"
    },
    "items_checked": 45,
    "issues_found": 3,
    "report_url": "https://..."
  }
}`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Validação de Segurança (Node.js)</h3>
                <CodeBlock
                  id="webhook-validation"
                  language="javascript"
                  code={`const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

app.post('/webhook/nsa', (req, res) => {
  const signature = req.headers['x-nsa-signature'];
  const payload = JSON.stringify(req.body);
  
  if (validateWebhook(payload, signature, 'SEU_SECRET')) {
    console.log('Webhook válido:', req.body);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API REST */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API REST
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Autenticação</h3>
                <p className="text-muted-foreground">
                  Todas as requisições devem incluir um token Bearer:
                </p>
                <CodeBlock
                  id="api-auth"
                  language="bash"
                  code={`Authorization: Bearer SEU_TOKEN_DE_API`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Base URL</h3>
                <CodeBlock
                  id="api-base"
                  language="text"
                  code={`https://seu-dominio.com/api/v1`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Endpoints Principais</h3>
                <div className="space-y-3">
                  <div>
                    <Badge className="mb-2">GET /inspections</Badge>
                    <p className="text-sm text-muted-foreground">Listar todas as inspeções</p>
                  </div>
                  <div>
                    <Badge className="mb-2">GET /inspections/:id</Badge>
                    <p className="text-sm text-muted-foreground">Obter detalhes de uma inspeção</p>
                  </div>
                  <div>
                    <Badge className="mb-2">POST /inspections</Badge>
                    <p className="text-sm text-muted-foreground">Criar nova inspeção</p>
                  </div>
                  <div>
                    <Badge className="mb-2">GET /vehicles</Badge>
                    <p className="text-sm text-muted-foreground">Listar veículos</p>
                  </div>
                  <div>
                    <Badge className="mb-2">POST /vehicles</Badge>
                    <p className="text-sm text-muted-foreground">Cadastrar veículo</p>
                  </div>
                  <div>
                    <Badge className="mb-2">GET /drivers</Badge>
                    <p className="text-sm text-muted-foreground">Listar motoristas</p>
                  </div>
                  <div>
                    <Badge className="mb-2">POST /drivers</Badge>
                    <p className="text-sm text-muted-foreground">Cadastrar motorista</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Exemplo Node.js</h3>
                <CodeBlock
                  id="api-nodejs"
                  language="javascript"
                  code={`const axios = require('axios');

const api = axios.create({
  baseURL: 'https://seu-dominio.com/api/v1',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Listar inspeções
async function getInspections() {
  const response = await api.get('/inspections', {
    params: {
      page: 1,
      limit: 50,
      start_date: '2025-01-01'
    }
  });
  console.log(response.data);
}

// Criar veículo
async function createVehicle(data) {
  const response = await api.post('/vehicles', data);
  console.log('Veículo criado:', response.data);
}`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Exemplo Python</h3>
                <CodeBlock
                  id="api-python"
                  language="python"
                  code={`import requests

API_URL = 'https://seu-dominio.com/api/v1'
API_TOKEN = 'SEU_TOKEN'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

# Listar inspeções
def get_inspections():
    params = {
        'page': 1,
        'limit': 50,
        'start_date': '2025-01-01'
    }
    response = requests.get(
        f'{API_URL}/inspections',
        headers=headers,
        params=params
    )
    return response.json()

# Criar veículo
def create_vehicle(vehicle_data):
    response = requests.post(
        f'{API_URL}/vehicles',
        headers=headers,
        json=vehicle_data
    )
    return response.json()`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Limite de Taxa</h3>
                <p className="text-muted-foreground">
                  1000 requisições por hora
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Documentação Completa</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Para mais detalhes e exemplos avançados, consulte o arquivo INTEGRACAO_DOCS.md na raiz do projeto.
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Documentação Completa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
