# Guia de Testes - Integração n8n Payment

## Pré-requisitos

1. ✅ n8n rodando e acessível
2. ✅ Variável `NEXT_PUBLIC_N8N_URL` configurada
3. ✅ Aplicação rodando (`npm run dev`)
4. ✅ Firebase configurado

## Teste Rápido (Manual)

### 1. Teste Básico no Navegador

1. Abra a aplicação: `http://localhost:3000`
2. Faça login
3. Adicione produtos ao carrinho
4. Clique em "Finalizar Compra"
5. Preencha os dados:
   - CPF: `12345678900`
   - Endereço completo
6. Clique em "Pagar"
7. Verifique os logs no console do navegador

**Resultado Esperado:**
- ✅ Logs detalhados no console
- ✅ Redirecionamento para link de pagamento
- ✅ OU mensagem de erro clara

### 2. Teste com Console do Navegador

Abra o console e execute:

```javascript
// Testes já estão disponíveis em window.n8nTests

// Teste completo
await window.n8nTests.runAllTests()

// Ou testes individuais
await window.n8nTests.testImageConversion()
await window.n8nTests.testSplitCalculation()
await window.n8nTests.testCreatePaymentWithoutAffiliate()
await window.n8nTests.testCreatePaymentWithAffiliate()
```

## Validações Importantes

### ✅ Verificar Conversão de Imagens

As imagens **DEVEM** ser convertidas para base64. Verifique nos logs:

```
🖼️ Processando itens do carrinho...
[Log mostrando conversão de cada imagem]
```

### ✅ Verificar Estrutura da Requisição

Procure no console por:

```
📤 Enviando requisição para n8n...
```

A estrutura deve conter:
- `billingTypes: ["CREDIT_CARD", "PIX"]`
- `items` com `imageBase64`
- `customerData` completo
- `splits` calculados
- `companyId` e `userId`

### ✅ Verificar Resposta do n8n

#### Sucesso:
```javascript
{
  success: true,
  paymentLink: "https://...",
  orderId: "..."
}
```

#### Erro:
```javascript
{
  success: false,
  errors: [
    {
      code: "ERROR_CODE",
      description: "Descrição"
    }
  ]
}
```

## Checklist de Teste

### Antes de Testar
- [ ] n8n está rodando?
- [ ] `NEXT_PUBLIC_N8N_URL` está configurado?
- [ ] Aplicação rodando sem erros?
- [ ] Firebase configurado corretamente?

### Durante o Teste
- [ ] Logs aparecem no console?
- [ ] Imagens sendo convertidas?
- [ ] Requisição enviada ao n8n?
- [ ] Resposta recebida?

### Cenários de Teste

#### ✅ Teste 1: Checkout Simples
1. Adicionar 1 produto ao carrinho
2. Finalizar compra
3. Preencher dados
4. Verificar pagamento criado

#### ✅ Teste 2: Checkout com Múltiplos Produtos
1. Adicionar vários produtos ao carrinho
2. Finalizar compra
3. Verificar que todos os produtos aparecem nos items

#### ✅ Teste 3: Checkout com Cupom de Afiliado
1. Aplicar cupom de afiliado
2. Finalizar compra
3. Verificar splits de pagamento nos logs

#### ✅ Teste 4: Tratamento de Erro
1. Desabilitar n8n temporariamente
2. Tentar finalizar compra
3. Verificar mensagem de erro user-friendly

#### ✅ Teste 5: Dados Salvos
1. Finalizar compra uma vez
2. Iniciar novo checkout
3. Verificar se dados foram pré-preenchidos

## Debugging

### Problema: Não recebe link de pagamento

**Verificar:**
1. Console do navegador tem erros?
2. n8n recebeu a requisição?
3. n8n respondeu corretamente?
4. Estrutura da resposta está correta?

**Logs a procurar:**
```
❌ Erro na criação do pagamento: ...
❌ Resposta inesperada do servidor: ...
```

### Problema: Imagens não aparecem no checkout

**Verificar:**
1. URLs das imagens são válidas?
2. Conversão para base64 funcionou?
3. Base64 está no payload enviado?

**Logs a procurar:**
```
🖼️ Convertendo imagem para base64: ...
✅ Imagem convertida com sucesso
```

### Problema: Erro de split de pagamento

**Verificar:**
1. `companyWalletId` está definido?
2. Cálculo de splits está correto?
3. Porcentagens somam corretamente?

**Logs a procurar:**
```
💰 Calculando splits de pagamento...
[Detalhes dos splits]
```

## Testes Automatizados

### Executar arquivo de teste

```bash
# No console do navegador
await window.n8nTests.runAllTests()
```

### Testes individuais

```bash
# Teste de conversão de imagens
await window.n8nTests.testImageConversion()

# Teste de cálculo de splits
await window.n8nTests.testSplitCalculation()

# Teste de estrutura de requisição
await window.n8nTests.testRequestStructure()

# Teste de criação de pagamento sem afiliado
await window.n8nTests.testCreatePaymentWithoutAffiliate()

# Teste de criação de pagamento com afiliado
await window.n8nTests.testCreatePaymentWithAffiliate()
```

## Validação da API n8n

### Endpoint de teste

```bash
curl -X POST \
  https://primary-production-9acc.up.railway.app/webhook-test/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "billingTypes": ["CREDIT_CARD"],
    "chargeTypes": ["DETACHED"],
    "minutesToExpire": 15,
    "externalReference": "test-123",
    "items": [{
      "name": "Teste",
      "quantity": 1,
      "value": 100,
      "imageBase64": "..."
    }],
    "customerData": {
      "name": "Teste",
      "cpfCnpj": "12345678900",
      "email": "teste@test.com",
      "phone": "11999999999",
      "address": "Rua Teste",
      "addressNumber": "123",
      "complement": "",
      "province": "Centro",
      "postalCode": "01310000",
      "city": "São Paulo"
    }
  }'
```

## Troubleshooting Common Issues

### 1. TypeError: Failed to fetch
**Causa**: n8n não está acessível  
**Solução**: Verificar se n8n está rodando e URL está correta

### 2. Resposta inesperada do servidor
**Causa**: Estrutura da requisição incorreta  
**Solução**: Verificar logs e comparar com estrutura esperada

### 3. Imagem não convertida
**Causa**: URL da imagem inválida ou inacessível  
**Solução**: Testar URL no navegador, verificar CORS

### 4. Split não aplicado
**Causa**: walletId não encontrado  
**Solução**: Verificar se empresa tem walletId configurado

## Próximos Passos Após Testes

1. ✅ Testes passando? → Deploy para produção
2. ❌ Testes falhando? → Debug e correção
3. ⚠️ Testes parciais? → Identificar problemas específicos

## Contato

Para suporte, verificar:
- Logs do console do navegador
- Logs do n8n
- Documentação em `/docs/N8N_PAYMENT_INTEGRATION.md`
