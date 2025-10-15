# Xeco Public - Instruções do Projeto

Este é um projeto React Next.js mobile-first com integração Firebase para a área pública do sistema Xeco.


## Stack Tecnológica
- **Next.js 14+** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS mobile-first
- **Firebase** - Backend-as-a-Service para autenticação e banco de dados
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

## Estrutura do Projeto
- `/src/app` - Pages e layouts (App Router)
- `/src/components` - Componentes reutilizáveis
- `/src/hooks` - Custom hooks
- `/src/lib` - Utilitários e configurações
- `/src/types` - Definições de tipos TypeScript
- `/src/styles` - Estilos globais

## Diretrizes de Desenvolvimento
- **Mobile First**: Sempre desenvolver pensando primeiro em mobile
- **Componentes**: Criar componentes pequenos e reutilizáveis
- **TypeScript**: Usar tipagem forte em todo o projeto
- **Performance**: Otimizar para Core Web Vitals
- **Acessibilidade**: Seguir padrões WCAG

## Firebase
- Firestore para dados
- Authentication para login/registro
- Storage para arquivos (se necessário)

## Instruções para Desenvolvedores
- Sempre sugira código modular e testável com Jest ou JUnit. Evite monolitos; divida em microservices onde possível. Inclua diagramas de fluxo em respostas complexas.

- Sempre gere testes unitários e de integração para novas funcionalidades usando Jest e React Testing Library.
- Para toda nova funcionalidade adicionada, inclua scripts de teste end-to-end com Playwright para validar que funciona conforme especificado, como cliques em buscas e renderização de resultados.
- Ao final de cada tarefa maior, gere um suite de testes regressivos com Playwright para confirmar que funcionalidades existentes (como buscas antigas ou navegação) não quebraram.
- Use TypeScript para tipagem estrita em todos os arquivos, evitando any types.
- Priorize performance: use lazy loading para listas de produtos/empresas e memoization em componentes.
- Adicione logging básico com console.log para erros e eventos chave, facilitando debug.

# UI Healing System

## Step 1

Step 1 is to take a screenshot of each screen in question using the Playwright MCP

## Step 2

Step 2, reference the directory /docs/ and find the files DESIGN_SYSTEM_REZOS.md and DESIGN_BRIEFINGS_REZOS.md

Based on those files, you are to grade the outputs of Step 1 objectively against that standard, and give your response on a scale of 1 to 10

## Step 3

For any screens or components that have a score less than 8 out of 10, you must make changes, and then repeat from Step 1.