# 🧪 Guia Rápido de Teste PWA - Xeco

## 🎯 Como Testar a Instalação Automática

### No Computador (Chrome Desktop)

1. **Abrir o site**:
   ```
   http://localhost:3000
   ```

2. **Abrir DevTools** (F12):
   - Application tab > Manifest
   - ✅ Verificar "Xeco" aparece
   - ✅ Verificar ícones listados
   - ✅ Verificar "Installable: Yes"

3. **Testar Service Worker**:
   - Application tab > Service Workers
   - ✅ Ver "sw.js" registrado
   - ✅ Status "activated"

4. **Ver banner de instalação**:
   - Aguardar 5 segundos
   - Banner aparece no canto inferior
   - Clicar "Instalar agora"
   - Confirmar no popup

5. **Testar app instalado**:
   - Ícone aparece na área de trabalho/Chrome Apps
   - Abrir app (sem barra de navegador)
   - Funciona offline

### No Celular Android

1. **Abrir no Chrome**:
   - Digite a URL do site
   - Aguarde 5 segundos

2. **Banner aparece automaticamente**:
   ```
   ┌─────────────────────────────┐
   │ 📥 Instalar Xeco           │
   │                            │
   │ ✓ Acesso sem navegador    │
   │ ✓ Funciona offline        │
   │                            │
   │ [Instalar] [Agora não]    │
   └─────────────────────────────┘
   ```

3. **Clicar "Instalar agora"**:
   - Popup nativo do Android aparece
   - Confirmar instalação

4. **Verificar tela inicial**:
   - Ícone do Xeco aparece
   - Abrir app (tela cheia, sem Chrome)

### No iPhone/iPad

1. **Abrir no Safari**:
   - Digite a URL do site
   - Aguarde 5 segundos

2. **Banner aparece**:
   - Clicar "Ver instruções"

3. **Seguir instruções**:
   ```
   1. Toque no botão Compartilhar ⬆️
   2. Role e toque "Adicionar à Tela Início"
   3. Toque "Adicionar"
   ```

4. **Verificar tela inicial**:
   - Ícone do Xeco aparece
   - Abrir app

---

## 🔍 Checklist de Testes

### ✅ Desktop Chrome

- [ ] Manifest.json carrega sem erro
- [ ] Service Worker registra
- [ ] Banner aparece após 5 segundos
- [ ] Clicar "Instalar" abre popup nativo
- [ ] App instala e abre em janela standalone
- [ ] Ícone aparece em chrome://apps
- [ ] App funciona offline (DevTools > Network > Offline)

### ✅ Android Chrome

- [ ] Banner aparece após 5 segundos
- [ ] Botão "Instalar agora" funciona
- [ ] Popup nativo do Android aparece
- [ ] App instala na tela inicial
- [ ] App abre em tela cheia (sem Chrome)
- [ ] App funciona offline
- [ ] Ícone e nome corretos

### ✅ iOS Safari

- [ ] Banner aparece após 5 segundos
- [ ] Modal de instruções abre
- [ ] Instruções são claras
- [ ] Seguir instruções instala o app
- [ ] App aparece na tela inicial
- [ ] App abre em tela cheia

### ✅ Funcionalidade Offline

- [ ] Visitar páginas com internet
- [ ] Desabilitar internet (Modo Avião)
- [ ] Páginas visitadas carregam do cache
- [ ] Console mostra "📦 Servindo do cache"
- [ ] Imagens e CSS funcionam offline

### ✅ Recusa e Re-prompt

- [ ] Clicar "Agora não"
- [ ] Banner desaparece
- [ ] Recarregar página
- [ ] Banner NÃO aparece novamente (espera 7 dias)
- [ ] Limpar localStorage: `localStorage.removeItem('pwa-prompt-dismissed')`
- [ ] Recarregar página
- [ ] Banner aparece novamente

---

## 🐛 Problemas Comuns

### Banner não aparece

**Possíveis causas:**
1. Já instalou o app → Desinstalar e tentar novamente
2. Recusou nos últimos 7 dias → Limpar localStorage
3. Service Worker não registrou → Verificar Console por erros
4. Não esperou 5 segundos → Aguardar mais

**Como resolver:**
```javascript
// No Console do navegador:
localStorage.removeItem('pwa-prompt-dismissed')
// Recarregar página
```

### Service Worker não registra

**Verificar:**
1. HTTPS ou localhost (HTTP não funciona)
2. Service Worker não bloqueado pelo browser
3. Console por erros

**Como resolver:**
```javascript
// No Console:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister()
  }
})
// Recarregar página
```

### Ícones não aparecem

**Motivo:** Ícones ainda não foram criados (estão configurados mas arquivos não existem)

**Como resolver:**
1. Ir para https://www.pwabuilder.com/imageGenerator
2. Upload logo do Xeco
3. Download zip com ícones
4. Extrair para `/public/icons/`

---

## 📸 Screenshots Esperados

### Banner Desktop
```
┌────────────────────────────────────────┐
│  📥 Instalar Xeco                     │
│     Acesso rápido na tela inicial     │
│                                        │
│  • Acesso sem abrir navegador         │
│  • Funciona offline                   │
│  • Notificações de ofertas            │
│                                        │
│  [Instalar agora]    [Agora não]      │
└────────────────────────────────────────┘
```

### Banner Mobile
```
┌──────────────────────┐
│ 📥 Instalar Xeco    │
│ Acesso rápido       │
│                     │
│ ✓ Sem navegador    │
│ ✓ Offline          │
│ ✓ Notificações     │
│                     │
│ [Instalar] [Não]   │
└──────────────────────┘
```

### Instruções iOS
```
┌───────────────────────────┐
│ 📱 Instalar Xeco no iOS  │
│                          │
│ 1️⃣ Toque em ⬆️ no Safari│
│ 2️⃣ "Adicionar à Tela    │
│    Início"               │
│ 3️⃣ Toque "Adicionar"    │
│                          │
│      [Entendi]           │
└───────────────────────────┘
```

---

## 🎯 Resultado Esperado

Após instalação bem-sucedida:

**Android/Chrome:**
- ✅ Ícone na tela inicial
- ✅ Abre em tela cheia (sem barra Chrome)
- ✅ Barra superior com cor coral (#FB6F72)
- ✅ Nome "Xeco" abaixo do ícone
- ✅ Splash screen coral ao abrir

**iOS/Safari:**
- ✅ Ícone na tela inicial
- ✅ Abre em tela cheia
- ✅ Barra superior escondida
- ✅ Nome "Xeco" abaixo do ícone

**Offline:**
- ✅ Páginas já visitadas funcionam
- ✅ Imagens carregam do cache
- ✅ CSS aplicado normalmente
- ✅ JavaScript funciona
- ✅ Apenas requisições novas falham

---

## 📊 Verificar Analytics

No Google Analytics, verificar eventos:

```javascript
// Instalação aceita
Event: app_install_prompt
outcome: accepted

// Instalação recusada
Event: app_install_prompt
outcome: dismissed
```

---

## 🚀 Próximos Passos

1. **URGENTE**: Gerar ícones (ver `/public/icons/README.md`)
2. Testar em dispositivos reais
3. Configurar Push Notifications (futuro)
4. Criar screenshots para App Store listing
5. Rodar Lighthouse audit (meta: >90)

---

**Última atualização**: 23/10/2025  
**Status**: ✅ Pronto para teste
