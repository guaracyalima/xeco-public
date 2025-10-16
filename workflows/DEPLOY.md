# 🚀 Workflow N8N - Configuração e Deploy

## 📋 Pré-requisitos

### 🔧 Credenciais Necessárias

1. **Firebase Service Account**
   - Tipo: Google API Service Account
   - Projeto: xeco-334f5
   - Permissões: Firestore Admin

2. **Asaas API**
   - Tipo: Header Authentication
   - Header: `access_token`
   - Value: `[SEU_TOKEN_ASAAS]`
   - Environment: Sandbox

### 🌍 Variáveis de Ambiente

```bash
# N8N Configuration
N8N_WEBHOOK_URL=https://primary-production-9acc.up.railway.app/webhook-test/create-payment

# Firebase Project
FIREBASE_PROJECT_ID=xeco-334f5
FIREBASE_DATABASE=rezos

# Asaas Configuration
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
ASAAS_CHECKOUT_ENDPOINT=/checkouts

# Platform Settings
PLATFORM_COMMISSION_RATE=0.08
OWNER_PERCENTAGE=92
CHECKOUT_EXPIRY_MINUTES=10
```

## 🔄 Processo de Deploy

### 1. Preparação do Ambiente
```bash
# 1. Acesse o painel do N8N
https://primary-production-9acc.up.railway.app

# 2. Faça login com as credenciais de admin

# 3. Vá para Workflows > Import from JSON
```

### 2. Importação do Workflow
```bash
# 1. Copie o conteúdo de checkout-workflow.json
cat /workflows/checkout-workflow.json

# 2. Cole no campo de importação do N8N

# 3. Configure as credenciais:
#    - Firebase Service Account
#    - Asaas API Header Auth
```

### 3. Configuração de Credenciais

#### Firebase Service Account
1. Vá em **Settings > Credentials**
2. Crie nova credencial: **Google API Service Account**
3. Upload do arquivo JSON da service account
4. Teste a conexão

#### Asaas API
1. Vá em **Settings > Credentials** 
2. Crie nova credencial: **Header Auth**
3. Header Name: `access_token`
4. Header Value: `[TOKEN_ASAAS]`
5. Teste com uma requisição simples

### 4. Ativação e Teste
```bash
# 1. Ative o workflow
# 2. Teste com dados de exemplo
# 3. Monitore logs de execução
# 4. Verifique webhook endpoint
```

## 🧪 Testes

### Teste Local
```bash
# Use o arquivo test-examples.json para testar
curl -X POST https://primary-production-9acc.up.railway.app/webhook-test/create-payment \
  -H "Content-Type: application/json" \
  -d @test-examples.json
```

### Teste de Integração
```bash
# 1. Execute o frontend local
npm run dev

# 2. Teste o fluxo completo de checkout
# 3. Verifique logs no N8N
# 4. Confirme salvamento no Firestore
```

## 🔍 Monitoramento

### Logs Importantes
- **Executions**: Cada execução do workflow
- **Webhook Calls**: Requisições recebidas
- **Firebase Operations**: Operações no Firestore
- **Asaas API Calls**: Chamadas para API do Asaas

### Métricas de Performance
- Tempo médio de execução
- Taxa de sucesso/erro
- Volume de transações
- Latência da API

### Alertas Configurados
- Falhas de execução
- Timeouts de API
- Erros de validação frequentes
- Problemas de conectividade

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Erro de Credencial Firebase
```
Solução: Verificar service account e permissões
```

#### 2. Timeout na API Asaas
```
Solução: Verificar token e status da API
```

#### 3. Validação de Dados
```
Solução: Conferir estrutura de dados enviada
```

#### 4. Webhook não responde
```
Solução: Verificar se workflow está ativo
```

### Debug Steps
1. Verificar logs de execução no N8N
2. Testar credenciais individualmente
3. Validar dados de entrada
4. Verificar conectividade com APIs externas

## 🔐 Segurança

### Práticas Implementadas
- Autenticação por token
- Validação rigorosa de entrada
- Logs de auditoria
- Isolamento de credenciais

### Considerações
- Tokens devem ser rotacionados periodicamente
- Logs não devem conter dados sensíveis
- Webhook deve ter rate limiting
- Backup das configurações

## 📈 Escalabilidade

### Otimizações Atuais
- Execução assíncrona
- Cache de dados da empresa
- Timeout configurado
- Retry automático

### Melhorias Futuras
- Load balancing
- Circuit breaker pattern
- Metrics collection
- Performance monitoring