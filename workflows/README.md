# 🤖 N8N Workflows - Xeco Platform

## � Estrutura da Pasta

```
/workflows/
├── README.md                 # Este arquivo - documentação geral
├── DEPLOY.md                # Guia de configuração e deploy
├── CHANGELOG.md             # Histórico de versões e mudanças
├── checkout-workflow.json   # Workflow principal de checkout
└── test-examples.json       # Exemplos para teste
```

## � Workflows Disponíveis

### 1. 🛒 Create Checkout Services
**Arquivo**: `checkout-workflow.json`
**Status**: ✅ Ativo em Produção
**Versão**: 1.0.0

**Descrição**: Workflow responsável por criar checkouts de pagamento através da integração com a API do Asaas, validando dados da empresa e calculando comissões da plataforma.

**Features**:
- ✅ Validação rigorosa de entrada
- ✅ Integração Firebase Firestore
- ✅ Split de pagamento (8% plataforma, 92% proprietário)
- ✅ Tratamento completo de erros
- ✅ Callback URLs configuradas

## 🔗 Links Importantes

- **N8N Produção**: https://primary-production-9acc.up.railway.app
- **Webhook Checkout**: `/webhook-test/create-payment`
- **Firebase Project**: xeco-334f5
- **Asaas API**: Sandbox Environment

## 🛠️ Como Usar

### 1. **Importar Workflow**
```bash
# 1. Acesse o N8N em produção
# 2. Vá em Workflows > Import from JSON  
# 3. Copie o conteúdo de checkout-workflow.json
# 4. Configure as credenciais necessárias
```

### 2. **Configurar Credenciais**
- Firebase Service Account
- Asaas API Header Auth

### 3. **Testar Workflow**
```bash
# Use os exemplos em test-examples.json
curl -X POST [WEBHOOK_URL] \
  -H "Content-Type: application/json" \
  -d @test-examples.json
```

## 📋 Pré-requisitos

- Acesso ao painel N8N
- Credenciais Firebase configuradas
- Token da API Asaas
- Empresas cadastradas no Firestore

## � Desenvolvimento

### Adicionar Novo Workflow
1. Crie o arquivo `.json` na pasta `/workflows/`
2. Documente no README.md
3. Adicione exemplos de teste
4. Atualize o CHANGELOG.md

### Atualizar Workflow Existente
1. Modifique o arquivo `.json`
2. Incremente a versão
3. Documente mudanças no CHANGELOG.md
4. Teste em ambiente de desenvolvimento

## � Monitoramento

### Métricas Importantes
- Taxa de sucesso dos checkouts
- Tempo médio de resposta
- Erros de validação
- Falhas de API externa

### Logs Estruturados
- Entrada de dados
- Validações realizadas
- Chamadas para APIs externas
- Respostas e erros

## 🆘 Suporte

### Problemas Comuns
- **Credenciais inválidas**: Verificar tokens e service accounts
- **Dados de entrada**: Validar estrutura JSON
- **API Asaas**: Verificar status do serviço
- **Firebase**: Confirmar permissões e conectividade

### Contatos
- **Desenvolvedor**: Equipe Xeco Platform
- **Infraestrutura**: Railway Support
- **APIs**: Documentação Asaas

---

**📝 Última Atualização**: 15 de outubro de 2025
**🔄 Versão**: 1.0.0
**🎯 Status**: Produção Ativa