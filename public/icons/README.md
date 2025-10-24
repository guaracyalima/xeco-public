# Geração de Ícones PWA

## Status: Aguardando Design

Os ícones da PWA precisam ser criados a partir de um logo/ícone original do Xeco.

### Tamanhos Necessários

Para uma PWA completa, precisamos dos seguintes ícones:

1. **icon-72x72.png** - Android (ldpi)
2. **icon-96x96.png** - Android (mdpi)
3. **icon-128x128.png** - Android (hdpi)
4. **icon-144x144.png** - Android (xhdpi)
5. **icon-152x152.png** - iOS
6. **icon-192x192.png** - Android (xxhdpi) - **OBRIGATÓRIO**
7. **icon-384x384.png** - Android (xxxhdpi)
8. **icon-512x512.png** - Splash screens - **OBRIGATÓRIO**

### Como Gerar

#### Opção 1: Usando Ferramentas Online (Mais Fácil)

1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
   - Upload sua logo/ícone base (recomendado: 512x512px ou maior)
   - Gera todos os tamanhos automaticamente
   - Download do zip com todos os ícones

2. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload sua logo
   - Gera favicons + ícones PWA
   - Customiza cores e aparência

#### Opção 2: Usando Sharp (Já Instalado no Projeto)

Se você tiver um ícone base em alta resolução (ex: `icon-base.png` de 1024x1024px):

```bash
# Instalar CLI do Sharp (se necessário)
npm install -g sharp-cli

# Gerar todos os tamanhos
sharp -i icon-base.png -o icon-72x72.png resize 72 72
sharp -i icon-base.png -o icon-96x96.png resize 96 96
sharp -i icon-base.png -o icon-128x128.png resize 128 128
sharp -i icon-base.png -o icon-144x144.png resize 144 144
sharp -i icon-base.png -o icon-152x152.png resize 152 152
sharp -i icon-base.png -o icon-192x192.png resize 192 192
sharp -i icon-base.png -o icon-384x384.png resize 384 384
sharp -i icon-base.png -o icon-512x512.png resize 512 512
```

#### Opção 3: Script Node.js (Automático)

Crie um arquivo `generate-icons.js` na raiz:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = 'icon-base.png'; // Seu ícone base
const outputDir = './public/icons';

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Gerar cada tamanho
sizes.forEach(size => {
  sharp(inputFile)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .then(() => console.log(`✅ Gerado: icon-${size}x${size}.png`))
    .catch(err => console.error(`❌ Erro ao gerar ${size}x${size}:`, err));
});
```

Execute:
```bash
node generate-icons.js
```

### Requisitos do Ícone Base

- **Formato**: PNG com fundo transparente
- **Tamanho mínimo**: 512x512px (recomendado: 1024x1024px)
- **Design**: 
  - Simples e reconhecível
  - Funciona bem em pequenas dimensões
  - Cores da marca Xeco (coral #FB6F72)
  - Sem texto (ou texto legível em tamanhos pequenos)
  - Margem interna de 10-20% para "safe zone"

### Ícones Adicionais (Shortcuts)

Para os atalhos no manifest, precisamos também de:

1. **search-icon.png** (96x96) - Ícone de busca
2. **heart-icon.png** (96x96) - Ícone de favoritos
3. **cart-icon.png** (96x96) - Ícone de carrinho
4. **user-icon.png** (96x96) - Ícone de perfil

Estes podem ser gerados a partir dos ícones Lucide React já usados no projeto.

### Screenshots (Opcional mas Recomendado)

Para melhor experiência de instalação, crie screenshots:

1. **home-mobile.png** (390x844) - Tela inicial no mobile
2. **home-desktop.png** (1920x1080) - Tela inicial no desktop

Tire screenshots reais do app rodando e salve em `/public/screenshots/`

### Apple Touch Icons

Para melhor suporte iOS, crie também:

1. **apple-touch-icon.png** (180x180)
2. **apple-touch-icon-precomposed.png** (180x180)

Coloque na raiz `/public/`

### Checklist

- [ ] Criar ícone base (512x512 ou maior)
- [ ] Gerar 8 tamanhos de ícones principais
- [ ] Gerar 4 ícones de shortcuts
- [ ] Criar 2 screenshots (mobile + desktop)
- [ ] Criar apple-touch-icon
- [ ] Testar em Chrome DevTools (Application > Manifest)
- [ ] Testar instalação em Android
- [ ] Testar instalação em iOS

### Próximos Passos

1. **URGENTE**: Criar ou obter o ícone base do Xeco
2. Escolher método de geração (recomendo PWA Asset Generator)
3. Fazer download e colocar os arquivos em `/public/icons/`
4. Verificar no Chrome DevTools se todos os ícones estão corretos

### Nota Temporária

Até que os ícones sejam criados, a PWA vai funcionar mas sem ícones personalizados. O browser vai usar um ícone genérico ou fazer screenshot da página.
