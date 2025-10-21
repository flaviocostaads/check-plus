# Documentação de Integrações - NSA Checklist

Este documento contém o passo a passo para configurar as integrações disponíveis no NSA Checklist.

## Índice
- [WhatsApp Business](#whatsapp-business)
- [Google Drive](#google-drive)
- [Webhooks](#webhooks)
- [API REST](#api-rest)

---

## WhatsApp Business

### Pré-requisitos
- Conta WhatsApp Business API
- Token de acesso do WhatsApp Business
- Número de telefone verificado

### Configuração

1. **Acesse as Configurações**
   - Navegue até **Configurações > Integrações**
   - Clique em **WhatsApp Business**

2. **Obtenha as Credenciais**
   - Acesse o [Facebook Business Manager](https://business.facebook.com/)
   - Vá em **WhatsApp Business API**
   - Copie seu **Token de Acesso** e **Phone Number ID**

3. **Configure no Sistema**
   ```json
   {
     "access_token": "SEU_TOKEN_DE_ACESSO",
     "phone_number_id": "SEU_PHONE_NUMBER_ID",
     "webhook_verify_token": "TOKEN_PERSONALIZADO_PARA_VERIFICACAO"
   }
   ```

4. **Configure o Webhook**
   - URL do Webhook: `https://seu-dominio.com/webhook/whatsapp`
   - Token de Verificação: Use o mesmo definido na configuração
   - Campos inscritos: `messages`, `message_status`

### Uso
- Notificações de inspeções são enviadas automaticamente
- Motoristas podem receber lembretes de vencimento de CNH
- Relatórios podem ser enviados via WhatsApp

---

## Google Drive

### Pré-requisitos
- Conta Google (Google Workspace ou Gmail)
- Projeto no Google Cloud Console
- API Google Drive habilitada

### Configuração

1. **Crie um Projeto no Google Cloud**
   - Acesse [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um novo projeto ou selecione um existente
   - Habilite a **Google Drive API**

2. **Crie Credenciais OAuth 2.0**
   - Vá em **APIs & Services > Credentials**
   - Clique em **Create Credentials > OAuth 2.0 Client ID**
   - Tipo de aplicativo: **Web Application**
   - URIs de redirecionamento autorizados: `https://seu-dominio.com/oauth/google/callback`

3. **Configure no Sistema**
   ```json
   {
     "client_id": "SEU_CLIENT_ID.apps.googleusercontent.com",
     "client_secret": "SEU_CLIENT_SECRET",
     "redirect_uri": "https://seu-dominio.com/oauth/google/callback",
     "folder_id": "ID_DA_PASTA_PRINCIPAL" // Opcional
   }
   ```

4. **Autorize o Acesso**
   - Após configurar, clique em **Conectar**
   - Autorize o acesso às pastas do Google Drive
   - O sistema salvará o token de atualização automaticamente

### Uso
- PDFs de inspeção são salvos automaticamente no Drive
- Fotos de veículos e danos são organizadas em pastas
- Backup automático de dados do sistema
- Sincronização em tempo real

### Estrutura de Pastas Recomendada
```
NSA Checklist/
├── Inspeções/
│   ├── 2025/
│   │   ├── Janeiro/
│   │   ├── Fevereiro/
│   │   └── ...
├── Veículos/
│   ├── Fotos/
│   └── Documentos/
└── Motoristas/
    └── Documentos/
```

---

## Webhooks

### Conceito
Webhooks permitem que o NSA Checklist envie notificações em tempo real para seus sistemas externos quando eventos específicos ocorrem.

### Eventos Disponíveis
- `inspection.created` - Nova inspeção criada
- `inspection.updated` - Inspeção atualizada
- `inspection.completed` - Inspeção finalizada
- `vehicle.created` - Novo veículo cadastrado
- `vehicle.updated` - Veículo atualizado
- `driver.created` - Novo motorista cadastrado
- `driver.updated` - Motorista atualizado

### Configuração

1. **Adicione um Webhook**
   - Acesse **Configurações > Integrações**
   - Clique em **Webhook Custom**

2. **Configure o Endpoint**
   ```json
   {
     "url": "https://seu-servidor.com/webhook/nsa-checklist",
     "secret": "CHAVE_SECRETA_COMPARTILHADA",
     "events": [
       "inspection.created",
       "inspection.completed",
       "vehicle.created"
     ],
     "active": true
   }
   ```

3. **Estrutura da Requisição**
   - Método: `POST`
   - Headers:
     ```
     Content-Type: application/json
     X-NSA-Signature: sha256=hash_da_assinatura
     X-NSA-Event: nome_do_evento
     X-NSA-Timestamp: timestamp_unix
     ```

### Payload de Exemplo

#### Inspeção Criada
```json
{
  "event": "inspection.created",
  "timestamp": "2025-01-20T10:30:00Z",
  "data": {
    "inspection_id": "123e4567-e89b-12d3-a456-426614174000",
    "vehicle_id": "456e7890-e89b-12d3-a456-426614174001",
    "driver_id": "789e0123-e89b-12d3-a456-426614174002",
    "inspector_id": "012e3456-e89b-12d3-a456-426614174003",
    "status": "in_progress",
    "created_at": "2025-01-20T10:30:00Z"
  }
}
```

#### Inspeção Finalizada
```json
{
  "event": "inspection.completed",
  "timestamp": "2025-01-20T11:45:00Z",
  "data": {
    "inspection_id": "123e4567-e89b-12d3-a456-426614174000",
    "vehicle": {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "marca_modelo": "Volkswagen Gol",
      "placa": "ABC-1234"
    },
    "driver": {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "nome_completo": "João Silva"
    },
    "items_checked": 45,
    "issues_found": 3,
    "completed_at": "2025-01-20T11:45:00Z",
    "report_url": "https://seu-dominio.com/reports/123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Validação de Segurança

Para verificar a autenticidade das requisições:

```javascript
const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Exemplo de uso
app.post('/webhook/nsa-checklist', (req, res) => {
  const signature = req.headers['x-nsa-signature'];
  const payload = JSON.stringify(req.body);
  
  if (validateWebhook(payload, signature, 'SEU_SECRET')) {
    // Processar webhook
    console.log('Webhook válido:', req.body);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});
```

### Reenvio de Webhooks
- Tentativas: 3 vezes
- Intervalo: 5 minutos entre tentativas
- Timeout: 30 segundos por requisição

---

## API REST

### Autenticação

Todas as requisições à API devem incluir um token de autenticação no header:

```
Authorization: Bearer SEU_TOKEN_DE_API
```

### Obter Token de API

1. Acesse **Configurações > Integrações**
2. Clique em **Gerar Token de API**
3. Copie e guarde o token com segurança (ele não será exibido novamente)

### Base URL

```
https://seu-dominio.com/api/v1
```

### Endpoints Principais

#### Listar Inspeções
```http
GET /inspections
```

**Parâmetros de Query:**
- `page` (int): Número da página (padrão: 1)
- `limit` (int): Itens por página (padrão: 50, máx: 100)
- `vehicle_id` (uuid): Filtrar por veículo
- `driver_id` (uuid): Filtrar por motorista
- `start_date` (date): Data início (formato: YYYY-MM-DD)
- `end_date` (date): Data fim (formato: YYYY-MM-DD)

**Resposta:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "vehicle_id": "456e7890-e89b-12d3-a456-426614174001",
      "driver_id": "789e0123-e89b-12d3-a456-426614174002",
      "inspector_id": "012e3456-e89b-12d3-a456-426614174003",
      "created_at": "2025-01-20T10:30:00Z",
      "updated_at": "2025-01-20T11:45:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

#### Obter Inspeção por ID
```http
GET /inspections/{id}
```

**Resposta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "vehicle": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "marca_modelo": "Volkswagen Gol",
    "placa": "ABC-1234",
    "vehicle_type": "car"
  },
  "driver": {
    "id": "789e0123-e89b-12d3-a456-426614174002",
    "nome_completo": "João Silva",
    "cpf": "123.456.789-00"
  },
  "inspector": {
    "id": "012e3456-e89b-12d3-a456-426614174003",
    "name": "Maria Santos",
    "email": "maria@example.com"
  },
  "items": [
    {
      "id": "345e6789-e89b-12d3-a456-426614174004",
      "name": "Pneus",
      "status": "ok",
      "observations": "Pneus em bom estado"
    }
  ],
  "damage_markers": [
    {
      "id": "567e8901-e89b-12d3-a456-426614174005",
      "description": "Arranhão na porta dianteira esquerda",
      "x_position": 45.5,
      "y_position": 60.3,
      "photos": [
        "https://storage.url/photo1.jpg"
      ]
    }
  ],
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T11:45:00Z"
}
```

#### Criar Inspeção
```http
POST /inspections
```

**Corpo da Requisição:**
```json
{
  "vehicle_id": "456e7890-e89b-12d3-a456-426614174001",
  "driver_id": "789e0123-e89b-12d3-a456-426614174002",
  "inspector_id": "012e3456-e89b-12d3-a456-426614174003",
  "latitude": -23.550520,
  "longitude": -46.633308
}
```

#### Listar Veículos
```http
GET /vehicles
```

**Parâmetros de Query:**
- `page` (int): Número da página
- `limit` (int): Itens por página
- `vehicle_type` (string): Tipo de veículo (car, motorcycle)
- `search` (string): Buscar por placa ou modelo

#### Criar Veículo
```http
POST /vehicles
```

**Corpo da Requisição:**
```json
{
  "marca_modelo": "Volkswagen Gol",
  "placa": "ABC-1234",
  "cor": "Prata",
  "ano": "2023",
  "renavam": "12345678901",
  "vehicle_type": "car",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

#### Listar Motoristas
```http
GET /drivers
```

**Nota:** Dados sensíveis são mascarados para usuários sem permissão.

#### Criar Motorista
```http
POST /drivers
```

**Corpo da Requisição:**
```json
{
  "nome_completo": "João Silva",
  "cpf": "123.456.789-00",
  "cnh_numero": "12345678901",
  "cnh_validade": "31/12/2025",
  "telefone": "(11) 99999-9999",
  "email": "joao@example.com",
  "endereco": "Rua Exemplo, 123 - São Paulo, SP"
}
```

### Códigos de Resposta

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Recurso não encontrado
- `422` - Erro de validação
- `429` - Limite de taxa excedido
- `500` - Erro interno do servidor

### Limite de Taxa

- **Limite:** 1000 requisições por hora
- **Header de Resposta:**
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 950
  X-RateLimit-Reset: 1642684800
  ```

### Paginação

Todas as listagens seguem o padrão de paginação:

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  },
  "links": {
    "first": "/api/v1/inspections?page=1",
    "prev": null,
    "next": "/api/v1/inspections?page=2",
    "last": "/api/v1/inspections?page=3"
  }
}
```

### Exemplo de Integração (Node.js)

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://seu-dominio.com/api/v1',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN_DE_API',
    'Content-Type': 'application/json'
  }
});

// Listar inspeções
async function getInspections() {
  try {
    const response = await api.get('/inspections', {
      params: {
        page: 1,
        limit: 50,
        start_date: '2025-01-01',
        end_date: '2025-01-31'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
}

// Criar inspeção
async function createInspection(data) {
  try {
    const response = await api.post('/inspections', data);
    console.log('Inspeção criada:', response.data);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
}
```

### Exemplo de Integração (Python)

```python
import requests

API_URL = 'https://seu-dominio.com/api/v1'
API_TOKEN = 'SEU_TOKEN_DE_API'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

# Listar inspeções
def get_inspections():
    params = {
        'page': 1,
        'limit': 50,
        'start_date': '2025-01-01',
        'end_date': '2025-01-31'
    }
    response = requests.get(f'{API_URL}/inspections', 
                          headers=headers, 
                          params=params)
    return response.json()

# Criar veículo
def create_vehicle(vehicle_data):
    response = requests.post(f'{API_URL}/vehicles',
                           headers=headers,
                           json=vehicle_data)
    return response.json()
```

---

## Suporte

Para suporte com integrações:
- Email: suporte@nsachecklist.com
- Documentação: https://docs.nsachecklist.com
- Status da API: https://status.nsachecklist.com

## Changelog

### v1.0.0 (20/01/2025)
- Release inicial
- WhatsApp Business, Google Drive, Webhooks e API REST
