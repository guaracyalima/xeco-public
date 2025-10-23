# 🔄 N8N Workflows - Xeco

Webhooks e automações N8N para o sistema Xeco.

## 📁 Estrutura

```
workflows/
├── README.md                          # Este arquivo
├── webhook-confirm-payment.json       # Webhook de confirmação de pagamento
├── checkout-workflow.json             # Workflow de criação de checkout (legado)
└── test-examples.json                 # Exemplos de teste
```

## 🎯 Workflows Disponíveis

### 1. � Webhook: Confirm Payment

**Arquivo:** `webhook-confirm-payment.json`  
**Status:** ✅ Pronto para uso  
**Documentação:** [WEBHOOK_CONFIRM_PAYMENT.md](../docs/WEBHOOK_CONFIRM_PAYMENT.md)

**Função:** Processa notificação do Asaas quando pagamento é confirmado

**Endpoint:**
```
POST /webhook/xeco-confirm-payment
```

**Fluxo:**
1. Recebe evento `PAYMENT_CONFIRMED` do Asaas
2. Valida dados obrigatórios
3. Busca order no Firebase
4. Atualiza status e dados de pagamento
5. Notifica empresa/cliente (opcional)
6. Responde sucesso/erro

**Deploy:**
```bash
# 1. Importar no N8N
# 2. Configurar credencial Firebase
# 3. Ativar workflow
# 4. Configurar URL no Asaas Dashboard
```

---

### 2. � Workflow: Create Checkout (LEGADO)

**Arquivo:** `checkout-workflow.json`  
**Status:** ⚠️ Substituído por API Route  
**Uso:** Apenas referência histórica

**Nota:** Este workflow foi substituído pela API Route `/api/checkout/create-payment`. Não usar em produção.

---

## � Como Usar

### 1. Importar Workflow no N8N

```bash
# Copiar JSON
cat workflows/webhook-confirm-payment.json | pbcopy

# No N8N UI:
# 1. Add workflow > Import from file
# 2. Colar JSON
# 3. Salvar
```

### 2. Configurar Credenciais

**Firebase Service Account:**
- Nome: `Firebase Service Account`
- Tipo: Google Service Account
- JSON: Service account do projeto Firebase

### 3. Ativar Workflow

- Toggle "Active" no canto superior direito
- Copiar URL do webhook gerado

### 4. Configurar Webhook no Asaas

```
Dashboard Asaas > Configurações > Webhooks
URL: https://seu-n8n.railway.app/webhook/xeco-confirm-payment
Eventos: PAYMENT_CONFIRMED
```

## 🧪 Testar Workflows

### Teste Manual (cURL)

```bash
curl -X POST https://seu-n8n.railway.app/webhook/xeco-confirm-payment \
  -H "Content-Type: application/json" \
  -d @workflows/test-examples.json
```

### Teste no Asaas Sandbox

1. Criar pagamento teste
2. Confirmar pagamento
3. Asaas dispara webhook automaticamente
4. Verificar logs no N8N > Executions

## 📊 Monitoramento

### Ver Execuções

```
N8N UI > Executions (menu lateral)
- Ver todas execuções
- Filtrar por sucesso/erro
- Ver dados de entrada/saída de cada node
```

### Logs Úteis

Cada node tem `console.log()` para debug:
- ✅ Dados validados
- 📋 Order encontrada
- 🔄 Dados atualizados
- ❌ Erros capturados

## 🐛 Troubleshooting

### Webhook não é chamado

- [ ] Workflow está ativo?
- [ ] URL configurada no Asaas está correta?
- [ ] Testar com cURL funciona?

### Order não atualiza

- [ ] Credenciais Firebase estão configuradas?
- [ ] `externalReference` no Asaas = `orderId` no Firebase?
- [ ] Ver erro no node "Update Order"

### Erro 404 Not Found

- [ ] Order existe no Firebase?
- [ ] `externalReference` está correto?
- [ ] Ver logs do node "Find Order"

## 📚 Workflows Futuros

### Em Desenvolvimento

- [ ] **Webhook: Payment Received** - Quando pagamento é recebido (não só confirmado)
- [ ] **Webhook: Payment Overdue** - Cobrança vencida
- [ ] **Webhook: Payment Refunded** - Reembolso processado
- [ ] **Workflow: Daily Sales Report** - Relatório diário de vendas
- [ ] **Workflow: Low Stock Alert** - Alerta de estoque baixo

### Ideias

- [ ] Auto-reembolso para produtos fora de estoque
- [ ] Notificação WhatsApp para empresas
- [ ] Sincronização com ERP externo
- [ ] Analytics e métricas automáticas

## 🔗 Links Úteis

- [N8N Docs](https://docs.n8n.io/)
- [Asaas Webhooks](https://docs.asaas.com/docs/webhooks)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [N8N Community](https://community.n8n.io/)

---

**� Feito com café, cigarro e muito código pelo Opala 6 cilindros** 🔥
