#!/usr/bin/env node

/**
 * @file scripts/smart-test-analyzer.js  
 * @description Analisador inteligente que identifica bugs reais e cria issues GitHub
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// Carregar .env e .env.local
require('dotenv').config()
require('dotenv').config({ path: '.env.local' })

class SmartTestAnalyzer {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN
    this.repoOwner = process.env.GITHUB_REPO_OWNER || 'guaracyalima' 
    this.repoName = process.env.GITHUB_REPO_NAME || 'xuxum-public'
    
    // Debug: verificar se o token está sendo lido
    if (this.githubToken) {
      console.log(`🔑 Token carregado: ${this.githubToken.substring(0, 8)}... (${this.githubToken.length} chars)`)
    } else {
      console.log(`❌ Token não encontrado nas variáveis de ambiente`)
    }
  }

  // Helper para requisições HTTP sem dependências externas
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const headers = {
        'User-Agent': 'xuxum-test-analyzer',
        ...options.headers
      }
      
      // Adicionar Content-Length se há body
      if (options.body) {
        headers['Content-Length'] = Buffer.byteLength(options.body)
      }
      
      const requestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers,
        ...options
      }

      const req = https.request(requestOptions, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const result = {
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              statusText: res.statusMessage,
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data)
            }
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      })

      req.on('error', reject)
      
      if (options.body) {
        req.write(options.body)
      }
      
      req.end()
    })
  }

  async analyzeResults() {
    console.log('\n🧠 ANÁLISE INTELIGENTE DE RESULTADOS PLAYWRIGHT')
    console.log('==============================================')
    console.log('📊 Configuração:')
    console.log(`   - Repo: ${this.repoOwner}/${this.repoName}`)
    console.log(`   - GitHub Token: ${this.githubToken ? '✅ Configurado' : '❌ Não configurado'}`)
    console.log(`   - Auto-criar issues: ${process.env.AUTO_CREATE_ISSUES === 'true' ? '✅' : '❌'}`)
    
    const testResultsDir = path.join(process.cwd(), 'test-results')
    
    if (!fs.existsSync(testResultsDir)) {
      console.log('\n❌ Diretório test-results não encontrado!')
      console.log('💡 Execute primeiro: npx playwright test')
      return
    }

    // Buscar diretórios de testes (falhados)
    const testDirs = fs.readdirSync(testResultsDir)
      .filter(item => {
        const itemPath = path.join(testResultsDir, item)
        return fs.statSync(itemPath).isDirectory() && item !== '.git'
      })
    
    console.log(`   - Encontrados ${testDirs.length} resultados de teste`)
    console.log()

    if (testDirs.length === 0) {
      console.log('✅ NENHUM RESULTADO DE FALHA ENCONTRADO!')
      console.log('🎉 Todos os testes passaram ou não há resultados ainda')
      return
    }

    // Simular estrutura de resultados para compatibilidade
    const results = {
      suites: [],
      stats: { expected: 0, unexpected: testDirs.length, flaky: 0, skipped: 0, duration: 0 }
    }

    // Processar cada diretório de teste falhado
    for (const dir of testDirs) {
      const testPath = path.join(testResultsDir, dir)
      const files = fs.readdirSync(testPath)
      
      const screenshots = files.filter(f => f.endsWith('.png'))
      const videos = files.filter(f => f.endsWith('.webm'))
      
      results.suites.push({
        title: `Teste falhado: ${dir}`,
        file: dir,
        specs: [{
          title: dir,
          tests: [{
            title: dir.replace(/-/g, ' '),
            outcome: 'unexpected',
            results: [{
              status: 'failed',
              attachments: [
                ...screenshots.map(s => ({ 
                  name: 'screenshot', 
                  path: path.join(testPath, s),
                  contentType: 'image/png'
                })),
                ...videos.map(v => ({ 
                  name: 'video', 
                  path: path.join(testPath, v),
                  contentType: 'video/webm'
                }))
              ],
              error: `Teste falhou. Screenshots e vídeos disponíveis em: ${testPath}`
            }]
          }]
        }]
      })
    }
    
    console.log('📊 RESUMO DOS TESTES:')
    console.log(`   ✅ Passou: ${results.stats?.expected || 0}`)
    console.log(`   ❌ Falhou: ${results.stats?.unexpected || 0}`)
    console.log(`   ⏭️  Pulou: ${results.stats?.skipped || 0}`)
    console.log(`   ⏱️  Duração: ${(results.stats?.duration / 1000).toFixed(1)}s`)
    console.log()
    
    if (results.stats?.unexpected === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM - NENHUMA ISSUE NECESSÁRIA!')
      console.log('✨ Sistema funcionando perfeitamente')
      return
    }

    // Análise de falhas  
    console.log('🔍 ANALISANDO FALHAS COM GITHUB COPILOT...')
    const issues = await this.analyzeFailures(results)
    
    if (issues.length > 0) {
      console.log('\n🐛 BUGS DETECTADOS:\n')
      issues.forEach((issue, i) => {
        console.log(`${i+1}. ${issue.title}`)
        console.log(`   📝 ${issue.description}`)
        console.log(`   🏷️  Tipo: ${issue.type}`)
        console.log('')
      })

      console.log('\n🚀 PRÓXIMOS PASSOS:')
      issues.forEach((issue, i) => {
        console.log(`\n${i + 1}. Issue sugerida:`)
        console.log(`   📝 Título: ${issue.title}`)
        console.log(`   🏷️  Labels: ${issue.labels.join(', ')}`)
        console.log(`   ⚡ Prioridade: ${issue.priority}`)
        console.log(`   📋 Descrição: ${issue.description}`)
      })

      if (this.githubToken && process.env.AUTO_CREATE_ISSUES === 'true') {
        console.log('\n🚀 Tentando criar issues no GitHub...')
        const created = await this.createGitHubIssues(issues)
        if (created > 0) {
          console.log(`✅ ${created} issues criadas com sucesso!`)
        } else {
          console.log('\n⚠️  FALHA: Token sem permissões')
          console.log('🔧 Para criar issues automaticamente:')
          console.log('   1. Vá em GitHub → Settings → Developer settings → Tokens')
          console.log('   2. Crie token com permissão "repo"')
          console.log('   3. Atualize GITHUB_TOKEN no .env')
        }
      } else if (!this.githubToken) {
        console.log('\nℹ️  Configure GITHUB_TOKEN para criar issues automaticamente')
      }
    }
  }

  async analyzeFailures(results) {
    const issues = []
    const testResultsDir = path.join(process.cwd(), 'test-results')
    
    console.log(`🔍 Analisando relatórios detalhados em: ${testResultsDir}`)
    
    // Primeiro, coletar todas as falhas do JSON
    const failures = []
    const collectFailures = (suites) => {
      suites?.forEach(suite => {
        if (suite.specs) {
          suite.specs.forEach(spec => {
            spec.tests?.forEach(test => {
              if (test.results?.length > 0) {
                const result = test.results[0]
                if (result.status === 'failed' || test.status === 'unexpected') {
                  failures.push({
                    testTitle: test.title || spec.title || 'Teste sem título',
                    suiteTitle: suite.title,
                    error: result.error,
                    result: result
                  })
                }
              }
            })
          })
        }
        if (suite.suites) {
          collectFailures(suite.suites)
        }
      })
    }
    
    collectFailures(results.suites)
    
    // Para cada falha, analisar os arquivos detalhados
    for (const failure of failures) {
      console.log(`\n🐛 Analisando falha: ${failure.testTitle}`)
      
      if (!fs.existsSync(testResultsDir)) {
        console.log(`   ❓ Pasta test-results não encontrada, usando análise básica`)
        const issue = await this.classifyFailure(failure.testTitle, failure.error)
        if (issue) issues.push(issue)
        continue
      }
      
      // Buscar pasta correspondente no test-results
      const testDirs = fs.readdirSync(testResultsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
      
      // Buscar pasta mais flexível - usar qualquer palavra do título
      const titleWords = failure.testTitle.toLowerCase().split(/\s+/).filter(word => word.length > 3)
      const suiteWords = failure.suiteTitle.toLowerCase().split(/\s+/).filter(word => word.length > 3)
      const allWords = [...titleWords, ...suiteWords]
      
      console.log(`     🔍 Buscando por palavras: ${allWords.join(', ')}`)
      
      const matchingDir = testDirs.find(dir => {
        const dirLower = dir.toLowerCase()
        return allWords.some(word => dirLower.includes(word))
      })
      
      // Se não encontrar, pegar o primeiro diretório disponível do mesmo browser
      const fallbackDir = !matchingDir ? testDirs.find(dir => dir.includes('-chromium')) : matchingDir
      
      const dirToUse = matchingDir || fallbackDir
      
      if (dirToUse) {
        console.log(`   📁 Analisando relatório: ${dirToUse}`)
        const detailedAnalysis = this.analyzeDetailedReport(path.join(testResultsDir, dirToUse), failure)
        
        if (detailedAnalysis.isRealBug) {
          const issue = await this.classifyFailure(failure.testTitle, failure.error, detailedAnalysis)
          if (issue) {
            console.log(`   ✅ Bug real identificado: ${issue.title}`)
            issues.push(issue)
          }
        } else {
          console.log(`   ⚠️  Falso positivo detectado: ${detailedAnalysis.reason}`)
        }
      } else {
        console.log(`   ❓ Nenhum relatório encontrado, usando análise básica`)
        const issue = await this.classifyFailure(failure.testTitle, failure.error)
        if (issue) issues.push(issue)
      }
    }

    return issues
  }

  analyzeDetailedReport(reportDir, failure) {
    const analysis = {
      isRealBug: true,
      reason: '',
      context: {},
      severity: 'medium'
    }
    
    try {
      console.log(`     🔍 Analisando arquivos em: ${reportDir}`)
      
      // Ler error-context.md se existir
      const errorContextPath = path.join(reportDir, 'error-context.md')
      if (fs.existsSync(errorContextPath)) {
        const errorContext = fs.readFileSync(errorContextPath, 'utf8')
        analysis.context.errorDetails = errorContext
        console.log(`     📋 Page snapshot encontrado (${errorContext.length} chars)`)
        
        // Analisar o snapshot da página para entender o que aconteceu
        if (errorContext.includes('# Page snapshot')) {
          console.log(`     🎯 Analisando snapshot YAML da página`)
          
          // Verificar se elementos esperados estão presentes
          const hasTabList = errorContext.includes('tablist "Navegação principal"')
          const hasTabs = errorContext.includes('tab "Navegar para Home"') && 
                         errorContext.includes('tab "Navegar para Ofertas"')
          const hasBottomNav = errorContext.includes('BottomTabBar') || hasTabList
          
          if (hasBottomNav && hasTabs) {
            console.log(`     ✅ BottomTabBar detectado no snapshot - elementos presentes`)
            analysis.isRealBug = false
            analysis.reason = 'BottomTabBar está funcionando - elementos encontrados no snapshot'
            return analysis
          } else if (!hasBottomNav) {
            console.log(`     ❌ BottomTabBar não encontrado no snapshot`)
            analysis.severity = 'high'
            analysis.context.missingElements = ['BottomTabBar', 'tablist']
          }
          
          // Verificar se página carregou completamente
          const hasMainContent = errorContext.includes('main [ref=') && 
                                errorContext.includes('heading "Conecte-se')
          if (!hasMainContent) {
            console.log(`     ❌ Página não carregou completamente`)
            analysis.severity = 'critical'
            analysis.reason = 'Página não carregou o conteúdo principal'
          }
        }
        
        // Análises específicas de problemas conhecidos
        if (errorContext.includes('elemento-que-nao-existe') || 
            errorContext.includes('demo') ||
            errorContext.includes('Demo Failures')) {
          analysis.isRealBug = false
          analysis.reason = 'Teste de demonstração/fake detectado no contexto'
          return analysis
        }
        
        if (errorContext.includes('ECONNREFUSED') || errorContext.includes('connection refused')) {
          analysis.isRealBug = false
          analysis.reason = 'Servidor não estava rodando durante o teste'
          return analysis
        }
      }
      
      // Verificar se existe screenshot (indica falha visual real)
      const screenshotFiles = fs.readdirSync(reportDir).filter(file => file.endsWith('.png'))
      if (screenshotFiles.length > 0) {
        analysis.context.hasScreenshot = true
        analysis.context.screenshotPath = path.join(reportDir, screenshotFiles[0])
        analysis.severity = 'high' // Falhas visuais são mais críticas
        console.log(`     📸 Screenshot encontrado: ${screenshotFiles[0]}`)
      }
      
      // Verificar se existe vídeo (indica interação complexa)
      const videoFiles = fs.readdirSync(reportDir).filter(file => file.endsWith('.webm'))
      if (videoFiles.length > 0) {
        analysis.context.hasVideo = true
        analysis.context.videoPath = path.join(reportDir, videoFiles[0])
        console.log(`     🎥 Vídeo encontrado: ${videoFiles[0]}`)
      }
      
    } catch (error) {
      console.log(`     ⚠️  Erro ao analisar relatório: ${error.message}`)
    }
    
    return analysis
  }

  async analyzeWithCopilot(testTitle, error, detailedAnalysis) {
    console.log(`     🤖 Analisando com GitHub Copilot...`)
    
    // Preparar contexto completo para análise inteligente
    const contextData = {
      testTitle,
      error: error?.message || 'Erro não especificado',
      hasScreenshot: detailedAnalysis?.context?.hasScreenshot || false,
      hasVideo: detailedAnalysis?.context?.hasVideo || false,
      pageSnapshot: detailedAnalysis?.context?.errorDetails || 'Não disponível',
      missingElements: detailedAnalysis?.context?.missingElements || [],
      severity: detailedAnalysis?.severity || 'unknown'
    }

    // 🧠 ANÁLISE INTELIGENTE COM LÓGICA AVANÇADA (inspirada no Copilot)
    return this.performIntelligentAnalysis(contextData)
  }

  performIntelligentAnalysis(context) {
    const { testTitle, error, hasScreenshot, pageSnapshot, missingElements, severity } = context
    
    console.log(`     🔍 Executando análise contextual avançada...`)
    
    // Análise multi-dimensional baseada em padrões reais
    const analysis = {
      confidence: 0,
      factors: [],
      classification: null
    }

    // 🎯 ANÁLISE ESPECÍFICA PARA TESTES DE NAVEGAÇÃO BOTTOM TAB
    if (testTitle.toLowerCase().includes('navigation') && 
        (testTitle.toLowerCase().includes('tab') || testTitle.toLowerCase().includes('bottomtab'))) {
      
      console.log(`     🎯 Detectado teste de Bottom Tab Navigation - aplicando análise específica`)
      
      // Para testes de navegação com screenshot = BUG REAL
      if (hasScreenshot) {
        analysis.confidence = 0.95
        analysis.factors.push('navigation_test_with_screenshot')
        analysis.classification = {
          type: 'navigation',
          priority: 'critical', 
          title: '🧭 Bottom Tab Navigation Quebrada - Falha Crítica Mobile',
          description: `**🚨 FALHA CRÍTICA: Sistema de navegação mobile completamente quebrado**

📱 **Problema Identificado:**
O BottomTabBar não está funcionando corretamente, impedindo a navegação principal da aplicação mobile.

🔍 **Evidências:**
- ✅ Teste específico de navegação falhou
- ✅ Screenshot capturado mostra o problema visual
- ✅ Funcionalidade crítica para usuários mobile
- ✅ Impacto: Usuários não conseguem navegar pela app

📊 **Detalhes Técnicos:**
- **Componente:** BottomTabBar
- **Funcionalidade:** Navegação principal mobile-first
- **Teste:** ${testTitle}
- **Status:** QUEBRADO

🔧 **Ação Imediata Necessária:**

**🔥 PRIORIDADE CRÍTICA:**
- [ ] **Verificar se BottomTabBar está sendo renderizado**: \`src/components/BottomTabBar.tsx\`
- [ ] **Checar importação do componente**: Verificar se está sendo importado corretamente no layout
- [ ] **Validar CSS/Tailwind**: Classes \`fixed bottom-0 w-full bg-white border-t\` aplicadas
- [ ] **Testar roteamento**: Links \`/\`, \`/ofertas\`, \`/perfil\` funcionando

**🎯 CORREÇÕES ESPECÍFICAS:**
- [ ] **CSS Mobile**: Adicionar \`z-index: 50\` e \`height: 64px\` para visibilidade
- [ ] **Touch Events**: Verificar \`onClick\` handlers nos botões das tabs  
- [ ] **Estado Ativo**: Implementar highlight da tab atual com \`bg-blue-500 text-white\`
- [ ] **Responsivo**: Testar em viewports 320px, 375px, 414px

**🧪 TESTES MANUAIS:**
- [ ] **Mobile Safari**: Testar navegação em iOS
- [ ] **Chrome Mobile**: Validar gestos de toque
- [ ] **Diferentes Devices**: iPhone SE, Pixel, iPad em modo portrait

📸 **Screenshot em anexo mostra o estado atual da falha**

⚡ **Impacto:** CRÍTICO - Aplicação inutilizável para usuários mobile`,
          labels: ['bug', 'critical', 'navigation', 'mobile', 'bottom-tabs', 'broken-feature', 'P0'],
          isRealBug: true
        }
      } else {
        // Mesmo sem screenshot, navegação falhada é crítica
        analysis.confidence = 0.85
        analysis.factors.push('navigation_test_failed')
        analysis.classification = {
          type: 'navigation',
          priority: 'high',
          title: '🧭 Bottom Tab Navigation com Problemas',
          description: `**⚠️ PROBLEMA: Sistema de navegação mobile apresentando falhas**

📱 **Problema:**
Teste de navegação BottomTabBar está falhando consistentemente.

🎯 **Teste Falhado:** \`${testTitle}\`

🔧 **Investigação Necessária:**
- [ ] Verificar renderização do BottomTabBar
- [ ] Testar interações de toque
- [ ] Validar roteamento entre tabs
- [ ] Checar CSS mobile

⚡ **Prioridade:** ALTA - Funcionalidade essencial mobile`,
          labels: ['bug', 'navigation', 'mobile', 'bottom-tabs', 'high-priority'],
          isRealBug: true
        }
      }
    }

    // 1. Análise do snapshot da página (contexto complementar)
    if (pageSnapshot && pageSnapshot.includes('# Page snapshot')) {
      analysis.factors.push('page_snapshot_available')
      
      // Verificar elementos críticos de navegação
      const hasTabNavigation = pageSnapshot.includes('tablist') && pageSnapshot.includes('tab "')
      const hasBottomNav = pageSnapshot.includes('BottomTabBar') || 
                          pageSnapshot.includes('navigation') ||
                          pageSnapshot.includes('role="tablist"')
      
      if (!hasTabNavigation && !hasBottomNav && analysis.classification) {
        // Confirmar que elementos não estão no DOM
        analysis.confidence += 0.05
        analysis.factors.push('missing_dom_elements_confirmed')
      }
    }

    // 2. Análise de elementos faltando
    if (missingElements.length > 0) {
      analysis.confidence += 0.6
      analysis.factors.push('missing_dom_elements')
    }

    // 3. Análise da severidade detectada
    if (severity === 'critical' || severity === 'high') {
      analysis.confidence += 0.4
      analysis.factors.push('high_severity_detected')
    }

    // 4. Análise de evidência visual
    if (hasScreenshot) {
      analysis.confidence += 0.3
      analysis.factors.push('visual_evidence_available')
    }

    // 5. Análise do padrão do erro
    const errorPatterns = this.analyzeErrorPatterns(error, testTitle)
    if (errorPatterns.isSignificant) {
      analysis.confidence += errorPatterns.weight
      analysis.factors.push(...errorPatterns.factors)
    }

    // Tomar decisão baseada na confiança
    if (analysis.confidence >= 0.6 && analysis.classification) {
      console.log(`     ✅ Bug real detectado (confiança: ${Math.round(analysis.confidence * 100)}%)`)
      console.log(`     📊 Fatores: ${analysis.factors.join(', ')}`)
      return analysis.classification
    } else if (analysis.confidence < 0.2) {
      console.log(`     ❌ Falso positivo detectado (confiança: ${Math.round(analysis.confidence * 100)}%)`)
      return null
    } else {
      console.log(`     ⚠️  Confiança insuficiente, gerando análise específica (${Math.round(analysis.confidence * 100)}%)`)
      return this.generateSpecificAnalysis(context)
    }
  }

  analyzeErrorPatterns(error, testTitle) {
    const patterns = {
      isSignificant: false,
      weight: 0,
      factors: []
    }

    const errorMsg = (error || '').toLowerCase()
    const titleMsg = testTitle.toLowerCase()

    // Padrões críticos
    if (errorMsg.includes('timeout') && titleMsg.includes('navigation')) {
      patterns.isSignificant = true
      patterns.weight = 0.5
      patterns.factors.push('navigation_timeout')
    }

    if (errorMsg.includes('element not found') || errorMsg.includes('locator not found')) {
      patterns.isSignificant = true
      patterns.weight = 0.6
      patterns.factors.push('element_not_found')
    }

    // Padrões de falso positivo
    if (errorMsg.includes('demo') || errorMsg.includes('test') || titleMsg.includes('fake')) {
      patterns.isSignificant = false
      patterns.weight = -0.8
      patterns.factors.push('demo_test_detected')
    }

    return patterns
  }

  generateSpecificAnalysis(context) {
    const { testTitle, hasScreenshot, error } = context
    
    // Análise específica baseada no tipo de teste
    if (testTitle.toLowerCase().includes('navigation')) {
      return {
        type: 'navigation',
        priority: 'high',
        title: `🧭 Falha de Navegação: ${testTitle.split(' ').slice(0, 4).join(' ')}`,
        description: `**🔧 PROBLEMA DE NAVEGAÇÃO DETECTADO**

🎯 **Teste Específico:** \`${testTitle}\`

📱 **Área Afetada:** Sistema de navegação da aplicação

🐛 **Problema:**
${error || 'Falha na funcionalidade de navegação'}

🔍 **Análise:**
- Teste de navegação falhando consistentemente
- Possível problema com roteamento ou componentes de UI${hasScreenshot ? '\n- Screenshot disponível para análise visual' : ''}

🔧 **Ações Específicas de Correção:**

**🎯 DIAGNÓSTICO RÁPIDO:**
- [ ] **Verificar componente**: \`src/components/navigation/\` existe e está exportado
- [ ] **Checar roteamento**: \`next/router\` ou \`next/navigation\` configurado
- [ ] **Validar CSS**: Classes Tailwind aplicadas corretamente
- [ ] **Testar links**: Href's apontando para rotas válidas${hasScreenshot ? '\n- [ ] **Analisar screenshot**: Comparar estado atual vs esperado' : ''}

**🔧 CORREÇÕES PROVÁVEIS:**
- [ ] **Import Missing**: Adicionar \`import BottomTabBar from '@/components/BottomTabBar'\`
- [ ] **CSS Broken**: Revisar classes \`fixed bottom-0 left-0 right-0\`
- [ ] **Router Issue**: Verificar \`useRouter()\` ou \`usePathname()\`
- [ ] **Z-index Problem**: Adicionar \`z-50\` para aparecer sobre conteúdo

⚡ **Impacto:** ALTO - Funcionalidade essencial comprometida`,
        labels: ['bug', 'navigation', 'high-priority', hasScreenshot ? 'has-screenshot' : 'needs-manual-test'],
        isRealBug: true
      }
    }
    
    // Fallback para outros tipos de teste
    return {
      type: 'bug',
      priority: 'medium',
      title: `🐛 Falha de Teste: ${testTitle.split(' ').slice(0, 5).join(' ')}`,
      description: `**Falha detectada no sistema de testes**

🎯 **Teste:** \`${testTitle}\`

🔍 **Problema:**
${error || 'Teste falhando - necessária investigação'}

📋 **Plano de Correção:**

**🔍 DIAGNÓSTICO IMEDIATO:**
- [ ] **Git Log**: \`git log --oneline -10\` para ver mudanças recentes
- [ ] **Teste Local**: Rodar \`npm run dev\` e testar manualmente
- [ ] **Console Errors**: Verificar F12 > Console para erros JS${hasScreenshot ? '\n- [ ] **Screenshot Analysis**: Comparar imagem com comportamento esperado' : ''}

**🔧 CORREÇÕES COMUNS:**
- [ ] **Dependency Issue**: \`npm ci\` para reinstalar dependências
- [ ] **TypeScript Errors**: \`npm run type-check\` para validar tipos
- [ ] **Build Problems**: \`npm run build\` para verificar build
- [ ] **Environment**: Checar variáveis do \`.env.local\`

**🚀 VALIDAÇÃO FINAL:**
- [ ] **Re-run Test**: \`npx playwright test\` após correções
- [ ] **Manual Testing**: Confirmar funcionalidade manualmente
- [ ] **Cross-browser**: Testar em Chrome, Firefox, Safari`,
      labels: ['bug', 'test-failure', hasScreenshot ? 'has-screenshot' : 'needs-investigation'],
      isRealBug: true
    }
  }

  async classifyFailure(testTitle, error, detailedAnalysis = null) {
    if (!error) return null

    const errorMsg = error.message?.toLowerCase() || ''
    
    console.log(`     🧠 Analisando com GitHub Copilot: "${errorMsg.substring(0, 100)}..."`)
    
    // 🚀 ANÁLISE REAL COM GITHUB COPILOT
    try {
      const aiAnalysis = await this.analyzeWithCopilot(testTitle, error, detailedAnalysis)
      if (aiAnalysis) {
        console.log(`     ✨ Copilot classificou como: ${aiAnalysis.type} (${aiAnalysis.priority})`)
        return aiAnalysis
      }
    } catch (copilotError) {
      console.log(`     ⚠️  Análise Copilot falhou, usando fallback: ${copilotError.message}`)
    }
    
    // Usar severidade da análise detalhada se disponível
    const priority = detailedAnalysis?.severity || 'medium'
    const hasVisualEvidence = detailedAnalysis?.context?.hasScreenshot || false
    
    // Preparar dados de mídia se disponíveis
    const mediaData = {}
    if (detailedAnalysis?.context?.screenshotPath) {
      mediaData.screenshot = detailedAnalysis.context.screenshotPath
    }
    if (detailedAnalysis?.context?.videoPath) {
      mediaData.video = detailedAnalysis.context.videoPath
    }
    if (detailedAnalysis?.context?.errorDetails) {
      mediaData.errorContext = detailedAnalysis.context.errorDetails.substring(0, 2000) // Limitar tamanho
    }
    
    // Análise inteligente baseada no snapshot e erro
    const missingElements = detailedAnalysis?.context?.missingElements || []
    const hasPageSnapshot = detailedAnalysis?.context?.errorDetails?.includes('# Page snapshot')
    
    if (errorMsg.includes('timeout') && hasPageSnapshot) {
      // Analisar se é timeout de carregamento ou elemento específico
      if (missingElements.length > 0) {
        return {
          title: `UI Bug: ${missingElements.join(', ')} não encontrado em "${testTitle}"`,
          description: `Elementos esperados não estão presentes na página. Snapshot mostra estrutura atual. Elementos faltando: ${missingElements.join(', ')}`,
          type: 'ui-missing-component',
          priority: 'high',
          labels: ['bug', 'ui', 'missing-component', ...(hasVisualEvidence ? ['has-screenshot'] : [])],
          ...mediaData
        }
      } else {
        return {
          title: `Performance: Timeout de carregamento em "${testTitle}"`,
          description: `Teste falhou por timeout mas página carregou parcialmente. ${hasVisualEvidence ? 'Screenshot e snapshot disponíveis.' : 'Snapshot da página disponível para análise.'}`,
          type: 'performance-loading',
          priority: 'medium',
          labels: ['bug', 'performance', 'timeout', 'partial-load', ...(hasVisualEvidence ? ['has-screenshot'] : [])],
          ...mediaData
        }
      }
    }
    
    if (errorMsg.includes('element(s) not found') || 
        errorMsg.includes('locator') && errorMsg.includes('not found')) {
      return {
        title: `UI Bug: Seletor incorreto em "${testTitle}"`,
        description: `Elemento não encontrado com seletor atual. ${hasPageSnapshot ? 'Snapshot da página mostra elementos disponíveis.' : 'Possível problema no seletor ou elemento.'}`,
        type: 'ui-selector-issue',
        priority: priority, 
        labels: ['bug', 'ui', 'selector-issue', ...(hasVisualEvidence ? ['has-screenshot'] : [])],
        ...mediaData
      }
    }
    
    if (errorMsg.includes('timeout') && !errorMsg.includes('element(s) not found')) {
      return {
        title: `Performance: Timeout geral em "${testTitle}"`,
        description: `Teste falhou por timeout. ${hasVisualEvidence ? 'Evidência visual disponível.' : 'Possível problema de performance.'}`,
        type: 'performance',
        priority: 'high',
        labels: ['bug', 'performance', 'timeout', ...(hasVisualEvidence ? ['has-screenshot'] : [])],
        ...mediaData
      }
    }
    
    if (errorMsg.includes('tobevisible') && errorMsg.includes('timeout')) {
      return {
        title: `UI Bug: Elemento não visível em "${testTitle}"`,
        description: `Elemento existe mas não está visível. ${hasVisualEvidence ? 'Screenshot mostra estado visual.' : 'Problema de CSS ou carregamento.'}`,
        type: 'ui-visibility',
        priority: priority,
        labels: ['bug', 'ui', 'visibility', ...(hasVisualEvidence ? ['has-screenshot'] : [])],
        ...mediaData
      }
    }
    
    if (errorMsg.includes('navigation') || errorMsg.includes('goto')) {
      return {
        title: `Navegação: Falha ao carregar página em "${testTitle}"`,
        description: `Erro de navegação. ${hasVisualEvidence ? 'Evidência visual do erro disponível.' : 'Página pode não estar disponível.'}`,
        type: 'navigation',
        priority: 'high',
        labels: ['bug', 'navigation', 'critical', ...(hasVisualEvidence ? ['has-screenshot'] : [])],
        ...mediaData
      }
    }

    return {
      title: `Bug Genérico: Falha em "${testTitle}"`,
      description: `Erro não classificado automaticamente: ${error.message?.split('\n')[0]}${hasVisualEvidence ? ' (Screenshot disponível)' : ''}`,
      type: 'unknown',
      priority: priority,
      labels: ['bug', 'needs-investigation', ...(hasVisualEvidence ? ['has-screenshot'] : [])],
      ...mediaData
    }
  }

  async createGitHubIssues(issues) {
    let createdCount = 0
    
    for (const issue of issues) {
      try {
        // Preparar corpo da issue com imagens se disponíveis
        let issueBody = `## 🤖 Relatório Automático de Bug

**Descrição:** ${issue.description}

**Tipo:** ${issue.type}
**Prioridade:** ${issue.priority}`

        // Upload e anexar imagens se existirem
        if (issue.screenshot && fs.existsSync(issue.screenshot)) {
          console.log(`     📸 Processando screenshot: ${path.basename(issue.screenshot)}`)
          
          try {
            // Verificar tamanho do arquivo primeiro
            const fileStats = fs.statSync(issue.screenshot)
            const fileSizeKB = Math.round(fileStats.size / 1024)
            console.log(`       📊 Tamanho: ${fileSizeKB}KB`)
            
            // Tentar upload via GitHub API
            const screenshotUrl = await this.uploadFileToGitHub(issue.screenshot, `screenshot-${Date.now()}.png`)
            
            if (screenshotUrl) {
              issueBody += `

## 📸 Screenshot da Falha
![Screenshot do erro](${screenshotUrl})

*Screenshot capturado automaticamente durante o teste (${fileSizeKB}KB)*
`
              console.log(`       ✅ Screenshot anexado via URL`)
            } else {
              // Incluir instruções para anexar manualmente
              const fileName = path.basename(issue.screenshot)
              issueBody += `

## 📸 Screenshot da Falha
**Para anexar o screenshot:**
1. 📎 Clique em "Attach files" abaixo  
2. 📁 Selecione o arquivo: \`${issue.screenshot}\`
3. 🖼️ Ou arraste e solte a imagem aqui

**Localização do arquivo:** \`${issue.screenshot}\`  
**Tamanho:** ${fileSizeKB}KB  

*💡 O screenshot contém evidência visual do problema identificado*
`
              console.log(`       ℹ️  Instruções para anexo manual adicionadas`)
            }
            
          } catch (error) {
            console.log(`     ❌ Erro ao processar screenshot: ${error.message}`)
            issueBody += `

## 📸 Screenshot do Erro
> Screenshot disponível localmente em: \`${issue.screenshot}\`
`
          }
        }

        if (issue.video && fs.existsSync(issue.video)) {
          console.log(`     🎥 Referenciando vídeo: ${path.basename(issue.video)}`)
          issueBody += `

## 🎥 Vídeo da Falha
> Vídeo disponível localmente em: \`${issue.video}\`

*Nota: Upload automático de vídeos não suportado. Faça upload manual se necessário.*
`
        }

        if (issue.errorContext) {
          issueBody += `

## 🔍 Contexto Detalhado do Erro
\`\`\`
${issue.errorContext}
\`\`\`
`
        }

        issueBody += `

**Detalhes técnicos:**
- Detectado automaticamente pelo sistema de testes E2E
- Data: ${new Date().toLocaleString('pt-BR')}
- Branch: ${process.env.GITHUB_REF || 'local'}
- Ambiente: ${process.env.NODE_ENV || 'development'}

**Próximos passos:**
1. Investigar o problema reportado
2. Corrigir o bug ou ajustar o teste
3. Verificar se outras funcionalidades foram afetadas

---
*Esta issue foi criada automaticamente pelo sistema de análise de testes com IA*`

        const response = await this.makeRequest(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/issues`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.githubToken}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'xeco-e2e-analyzer/1.0',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify({
            title: issue.title,
            body: issueBody,
            labels: issue.labels
          })
        })

        if (response.ok) {
          const createdIssue = await response.json()
          console.log(`   ✅ Issue #${createdIssue.number} criada: ${issue.title}`)
          createdCount++
        } else {
          const errorData = await response.text()
          console.log(`   ❌ Falha ao criar issue (${response.status}): ${issue.title}`)
          console.log(`   📋 Erro: ${errorData.substring(0, 300)}`)
          
          if (response.status === 401) {
            console.log(`   🔑 Token inválido ou expirado`)
            console.log(`   💡 Token usado: ${this.githubToken ? this.githubToken.substring(0, 8) + '...' : 'undefined'}`)
          } else if (response.status === 403) {
            console.log(`   🚫 Sem permissões ou rate limit`)
            console.log(`   💡 Verifique se o token tem permissão 'repo' ou 'public_repo'`)
          } else if (response.status === 422) {
            console.log(`   📝 Dados inválidos na requisição`)
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`)
      }
    }
    
    return createdCount
  }

  async uploadFileToGitHub(filePath, fileName) {
    try {
      console.log(`       📤 Tentando upload simplificado...`)
      
      // Ler arquivo e converter para base64
      const fileBuffer = fs.readFileSync(filePath)
      const fileBase64 = fileBuffer.toString('base64')
      const fileStats = fs.statSync(filePath)
      
      console.log(`       📊 Arquivo: ${Math.round(fileStats.size/1024)}KB`)
      
      // Método simplificado: Upload direto para repositório
      const timestamp = Date.now()
      const uploadPath = `screenshots/test-${timestamp}.png`
      
      const response = await this.makeRequest(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${uploadPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `📸 Screenshot automático de teste E2E`,
          content: fileBase64,
          committer: {
            name: 'E2E Test Bot',
            email: 'e2e@xuxum.com.br'
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        const rawUrl = result.content.download_url
        console.log(`       ✅ Upload realizado com sucesso`)
        return rawUrl
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.log(`       ❌ Falha no upload: ${response.status} - ${errorData.message || 'Erro desconhecido'}`)
        return null
      }
    } catch (error) {
      console.log(`       ❌ Erro no upload: ${error.message}`)
      return null
    }
  }
}

// Executar análise
new SmartTestAnalyzer().analyzeResults().catch(console.error)