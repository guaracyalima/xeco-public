#!/bin/bash

echo "🧪 Configurando ambiente de testes E2E - Xuxum"
echo "=============================================="

# Instalar Playwright
echo "📦 Instalando Playwright..."
npm install --save-dev @playwright/test

# Instalar browsers do Playwright
echo "🌐 Instalando browsers do Playwright..."
npx playwright install

# Criar diretório de relatórios se não existir
mkdir -p test-results
mkdir -p playwright-report

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "🚀 Para executar os testes:"
echo "   npm run test:e2e              # Todos os testes"
echo "   npm run test:e2e:headed       # Com interface visual"
echo "   npm run test:e2e:mobile       # Apenas mobile"
echo "   npm run test:e2e:debug        # Modo debug"
echo ""
echo "📊 Para ver relatórios:"
echo "   npm run test:report            # Abrir relatório HTML"
echo ""
echo "🧪 Testes específicos:"
echo "   npx playwright test homepage.e2e.spec.ts"
echo "   npx playwright test authentication.e2e.spec.ts" 
echo "   npx playwright test pwa-features.e2e.spec.ts"
echo ""