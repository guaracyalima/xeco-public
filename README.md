# Xeco Public - Área PúblicaThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Este é um projeto React Next.js mobile-first com integração Firebase para a área pública do sistema Xeco.## Getting Started



## 🚀 Stack TecnológicaFirst, run the development server:



- **Next.js 15** - Framework React com App Router```bash

- **TypeScript** - Tipagem estáticanpm run dev

- **Tailwind CSS** - Framework CSS mobile-first# or

- **Firebase** - Backend-as-a-Service para autenticação e banco de dadosyarn dev

- **React Hook Form** - Gerenciamento de formulários# or

- **Zod** - Validação de schemaspnpm dev

- **Lucide React** - Ícones# or

bun dev

## 📁 Estrutura do Projeto```



```Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

src/

├── app/                 # Pages e layouts (App Router)You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

│   ├── globals.css      # Estilos globais

│   ├── layout.tsx       # Layout raizThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

│   └── page.tsx         # Página inicial

├── components/          # Componentes reutilizáveis## Learn More

│   ├── layout/          # Componentes de layout

│   │   ├── Header.tsxTo learn more about Next.js, take a look at the following resources:

│   │   ├── Footer.tsx

│   │   └── Layout.tsx- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

│   └── ui/              # Componentes de UI- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

│       ├── Button.tsx

│       ├── Card.tsxYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

│       └── Input.tsx

├── context/             # Context API## Deploy on Vercel

│   └── AuthContext.tsx  # Contexto de autenticação

├── hooks/               # Custom hooksThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

│   ├── useLocalStorage.ts

│   └── useMediaQuery.tsCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

├── lib/                 # Utilitários e configurações
│   ├── firebase.ts      # Configuração do Firebase
│   └── utils.ts         # Funções utilitárias
└── types/               # Definições de tipos TypeScript
    └── index.ts
```

## 🛠️ Configuração

### 1. Clone o repositório
```bash
git clone [url-do-repositorio]
cd xeco-public
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env.local` e configure suas credenciais do Firebase:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações do Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# n8n Webhook URL
NEXT_PUBLIC_N8N_URL=https://primary-production-9acc.up.railway.app
```

### 4. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em [http://localhost:3000](http://localhost:3000).

## 📱 Design Mobile-First

Este projeto foi desenvolvido com foco em dispositivos móveis, utilizando:

- **Breakpoints do Tailwind CSS**:
  - `xs`: 475px+
  - `sm`: 640px+
  - `md`: 768px+
  - `lg`: 1024px+
  - `xl`: 1280px+
  - `2xl`: 1536px+

- **Hooks para responsividade**:
  - `useIsMobile()` - Detecta telas até 767px
  - `useIsTablet()` - Detecta telas entre 768px e 1023px
  - `useIsDesktop()` - Detecta telas a partir de 1024px

## 🔥 Firebase

O projeto está configurado para usar os seguintes serviços do Firebase:

- **Authentication** - Para login e registro de usuários
- **Firestore** - Banco de dados NoSQL
- **Storage** - Armazenamento de arquivos

## 💳 Integração de Pagamento (n8n)

O sistema utiliza integração com n8n para processar pagamentos via Asaas.

### Recursos
- ✅ Suporte a PIX e Cartão de Crédito
- ✅ Sistema de splits (plataforma + afiliado + loja)
- ✅ Conversão automática de imagens para base64
- ✅ Tratamento robusto de erros
- ✅ Callbacks de sucesso/cancelamento/expiração

### Documentação Completa
- [Integração n8n Payment](./docs/N8N_PAYMENT_INTEGRATION.md)
- [Guia de Testes](./docs/N8N_TESTING_GUIDE.md)
- [Changelog](./docs/N8N_CHANGELOG.md)

### Configuração Rápida
1. Configure a variável `NEXT_PUBLIC_N8N_URL` no `.env.local`
2. Execute a aplicação
3. Teste o checkout

### Teste a Integração
```javascript
// No console do navegador
await window.n8nTests.runAllTests()
```

## 🧩 Componentes Principais

### Layout
- `Header` - Cabeçalho com navegação responsiva
- `Footer` - Rodapé com informações da empresa
- `Layout` - Container principal da aplicação

### UI
- `Button` - Botão customizável com variações
- `Card` - Container para conteúdo
- `Input` - Campo de entrada de dados

### Context
- `AuthContext` - Gerenciamento de estado de autenticação

## 📚 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linting do código

## 🎯 Diretrizes de Desenvolvimento

- **Mobile First**: Sempre desenvolver pensando primeiro em mobile
- **Componentes**: Criar componentes pequenos e reutilizáveis
- **TypeScript**: Usar tipagem forte em todo o projeto
- **Performance**: Otimizar para Core Web Vitals
- **Acessibilidade**: Seguir padrões WCAG

## 🚀 Deploy

O projeto está configurado para deploy fácil em plataformas como Vercel, Netlify ou Firebase Hosting.

Para deploy na Vercel:
```bash
npm install -g vercel
vercel
```

## 📄 Licença

Este projeto é propriedade privada da equipe Xeco.# xeco-public
