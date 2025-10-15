# Design System - TheDir Inspired

Baseado na análise do template TheDir (https://templates.g5plus.net/thedir/index.html), este design system captura os elementos visuais e padrões de design para aplicação no projeto Xeco.

## 🎨 Paleta de Cores

### Cores Primárias
```css
--primary: #ff5a5f;           /* Coral/Rosa vibrante - Cor principal do site */
--secondary: #666666;         /* Cinza médio para textos secundários */
--dark: #000000;              /* Preto para textos principais */
--white: #ffffff;             /* Branco para fundos */
```

### Cores de Sistema
```css
--success: #67981a;           /* Verde para estados de sucesso */
--info: #3f93f3;              /* Azul para informações */
--warning: #ffba00;           /* Amarelo para avisos */
--danger: #ff0000;            /* Vermelho para erros */
--light: #f0f0f0;             /* Cinza claro para fundos */
```

### Escala de Cinzas
```css
--gray: #999999;              /* Cinza base */
--gray-01: #e8edef;           /* Cinza muito claro */
--gray-02: #f5f5f5;           /* Cinza claro para seções */
--gray-03: #eeeeee;           /* Cinza para bordas */
--gray-04: #eef1f2;           /* Cinza para cards */
--gray-05: #ecf0f1;           /* Cinza para áreas de conteúdo */
--gray-06: #f0f2f3;           /* Cinza para backgrounds alternativos */
--darker-light: #cccccc;      /* Cinza médio */
--lighter-dark: #262626;      /* Cinza escuro */
```

### Cores Complementares
```css
--blue: #01b3ed;              /* Azul vibrante */
--cyan: #0583c5;              /* Ciano */
--teal: #67981a;              /* Verde azulado */
--orange: #ffba00;            /* Laranja */
--green: #74b100;             /* Verde */
--dark-red: #cc0000;          /* Vermelho escuro */
```

## 📝 Tipografia

### Fonte Principal
```css
--font-family-sans-serif: "Work Sans", sans-serif;
--font-family-monospace: "Work Sans", sans-serif;
```

### Escala de Tamanhos
```css
/* Tamanhos base */
--font-size-base: 16px;
--line-height-base: 1.15;

/* Hierarquia de títulos */
--font-size-h1: 48px;         /* Hero title */
--font-size-h2: 32px;         /* Section titles */
--font-size-h3: 24px;         /* Subsection titles */
--font-size-h4: 20px;         /* Card titles */
--font-size-h5: 18px;         /* Small titles */
--font-size-h6: 16px;         /* Micro titles */

/* Tamanhos de texto */
--font-size-lg: 18px;         /* Lead text */
--font-size-md: 16px;         /* Body text */
--font-size-sm: 14px;         /* Small text */
--font-size-xs: 12px;         /* Micro text */
```

### Pesos de Fonte
```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## 📏 Breakpoints Responsivos

```css
--breakpoint-xs: 0px;
--breakpoint-sm: 576px;
--breakpoint-md: 768px;
--breakpoint-lg: 992px;
--breakpoint-xl: 1200px;
```

## 🎛️ Componentes

### Botões

#### Botão Primário
```css
.btn-primary {
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #e54b50;
  transform: translateY(-1px);
}
```

#### Botão Secundário
```css
.btn-secondary {
  background-color: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  border-radius: 4px;
  padding: 10px 22px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: var(--primary);
  color: white;
}
```

#### Botão de Busca
```css
.btn-search {
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 14px 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### Cards

#### Card Base
```css
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

#### Card de Listagem
```css
.listing-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.listing-card-image {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.listing-card-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--primary);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.listing-card-content {
  padding: 16px;
}

.listing-card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--dark);
}

.listing-card-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.listing-card-price {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 8px;
}

.listing-card-category {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--gray-02);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--secondary);
}
```

### Formulários

#### Input Base
```css
.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--gray-03);
  border-radius: 4px;
  font-size: 16px;
  background: white;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  border-color: var(--primary);
  outline: none;
}

.form-input::placeholder {
  color: var(--gray);
}
```

#### Search Bar
```css
.search-bar {
  display: flex;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.search-input {
  flex: 1;
  padding: 14px 16px;
  border: none;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
}
```

### Navegação

#### Header Principal
```css
.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: var(--dark);
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 32px;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: var(--secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover,
.nav-link.active {
  color: var(--primary);
}
```

#### Tabs
```css
.tabs {
  display: flex;
  background: var(--gray-02);
  border-radius: 4px;
  padding: 4px;
  gap: 4px;
}

.tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 600;
}

.tab.active {
  background: white;
  color: var(--primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## 🔄 Estados e Animações

### Hover Effects
```css
/* Efeito de elevação suave */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Efeito de escala sutil */
.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.02);
}
```

### Loading States
```css
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## 📐 Spacing System

```css
/* Baseado em múltiplos de 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

## 🎯 Padrões de Layout

### Container Principal
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: 24px;
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Responsive grid */
@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Seções
```css
.section {
  padding: 80px 0;
}

.section-sm {
  padding: 40px 0;
}

.section-lg {
  padding: 120px 0;
}

@media (max-width: 768px) {
  .section { padding: 40px 0; }
  .section-sm { padding: 24px 0; }
  .section-lg { padding: 60px 0; }
}
```

## ✨ Elementos Especiais

### Hero Section
```css
.hero {
  background: linear-gradient(135deg, #ff5a5f 0%, #ff7b7e 100%);
  color: white;
  text-align: center;
  padding: 120px 0 80px;
  position: relative;
  overflow: hidden;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 20px;
  opacity: 0.9;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .hero {
    padding: 80px 0 60px;
  }
  
  .hero-title {
    font-size: 32px;
  }
  
  .hero-subtitle {
    font-size: 18px;
  }
}
```

### Badges e Labels
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-primary {
  background: var(--primary);
  color: white;
}

.badge-success {
  background: var(--success);
  color: white;
}

.badge-warning {
  background: var(--warning);
  color: var(--dark);
}

.badge-outline {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
}
```

### Rating Stars
```css
.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-value {
  background: var(--warning);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.rating-count {
  font-size: 12px;
  color: var(--secondary);
}
```

## 🎨 Utilidades CSS

```css
/* Text utilities */
.text-primary { color: var(--primary); }
.text-secondary { color: var(--secondary); }
.text-dark { color: var(--dark); }
.text-white { color: white; }

.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-md); }
.text-lg { font-size: var(--font-size-lg); }

.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

/* Spacing utilities */
.m-auto { margin: auto; }
.mb-2 { margin-bottom: var(--space-2); }
.mb-4 { margin-bottom: var(--space-4); }
.mb-6 { margin-bottom: var(--space-6); }
.mb-8 { margin-bottom: var(--space-8); }

.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }

/* Display utilities */
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }

/* Flexbox utilities */
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: var(--space-2); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }

/* Border utilities */
.rounded { border-radius: 4px; }
.rounded-lg { border-radius: 8px; }
.rounded-full { border-radius: 50%; }

/* Shadow utilities */
.shadow-sm { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.shadow { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); }
.shadow-lg { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }
```

## 📱 Mobile-First Considerations

- Todas as interfaces devem ser projetadas primeiro para mobile
- Touch targets mínimos de 44px
- Navegação simplificada com menu hambúrguer
- Cards empilhados em colunas únicas em telas pequenas
- Texto legível sem zoom (mínimo 16px)
- Espaçamentos adequados para dedos (mínimo 8px entre elementos clicáveis)

## 🎯 Princípios de Design

1. **Simplicidade**: Interface limpa e descomplicada
2. **Consistência**: Padrões visuais repetidos em todo o sistema
3. **Hierarquia**: Clara diferenciação entre elementos importantes e secundários
4. **Acessibilidade**: Contraste adequado e navegação por teclado
5. **Performance**: Animações sutis que não prejudiquem a performance
6. **Responsividade**: Adaptação perfeita a todos os tamanhos de tela