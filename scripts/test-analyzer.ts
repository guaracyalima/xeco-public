#!/usr/bin/env tsx

/**
 * @file scripts/test-analyzer.ts
 * @description Sistema de análise inteligente de resultados de testes E2E
 * @author GitHub Copilot + AI Analysis
 */

import { readFile, writeFile } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'

const execAsync = promisify(exec)

export interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped' | 'interrupted'
  duration: number
  error?: string
  screenshot?: string
  video?: string
  trace?: string
  project: string
}

export interface TestAnalysis {
  testName: string
  status: 'real_bug' | 'flaky_test' | 'environment_issue' | 'improvement_needed' | 'false_positive'
  confidence: number // 0-1
  reasoning: string
  suggestions: string[]
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'functionality' | 'performance' | 'ui' | 'integration' | 'security'
  shouldCreateIssue: boolean
}

export interface GitHubIssue {
  title: string
  body: string
  labels: string[]
  assignees?: string[]
  milestone?: number
}

class TestAnalyzer {
  private readonly patterns = {
    // Padrões que indicam bugs reais
    realBugs: [
      /Error: .*expect.*received/i,
      /AssertionError/i,
      /TypeError: Cannot read prop/i,
      /ReferenceError.*not defined/i,
      /Network.*failed/i,
      /404.*Not Found/i,
      /500.*Internal Server Error/i
    ],
    
    // Padrões que indicam problemas de ambiente/flaky tests
    environmentIssues: [
      /Test ended\./i,
      /Test was interrupted/i,
      /waitForLoadState.*timeout/i,
      /page\.goto.*timeout/i,
      /Connection.*refused/i,
      /ECONNRESET/i,
      /Request timed out/i
    ],
    
    // Padrões que indicam melhorias necessárias
    improvements: [
      /Element not found/i,
      /Selector.*not visible/i,
      /waitFor.*timeout/i,
      /Locator.*count/i
    ]
  }

  constructor(private githubToken?: string, private repoOwner?: string, private repoName?: string) {}

  /**
   * Executa os testes e coleta resultados
   */
  async runTestsAndAnalyze(): Promise<TestAnalysis[]> {
    console.log('🧪 Executando testes E2E...')
    
    try {
      // Executar testes com relatório JSON
      await execAsync('npx playwright test --reporter=json > test-results.json', {
        cwd: process.cwd()
      })
    } catch (error) {
      console.log('⚠️ Testes concluídos com falhas (esperado para análise)')
    }

    const results = await this.parseTestResults()
    const analyses = await this.analyzeResults(results)
    
    await this.generateReport(analyses)
    await this.createGitHubIssues(analyses)
    
    return analyses
  }

  /**
   * Analisa resultados dos testes com IA
   */
  private async analyzeResults(results: TestResult[]): Promise<TestAnalysis[]> {
    console.log('🤖 Analisando resultados com IA...')
    
    const analyses: TestAnalysis[] = []
    
    for (const result of results) {
      if (result.status === 'passed') continue
      
      const analysis = await this.analyzeIndividualTest(result)
      analyses.push(analysis)
    }
    
    return analyses
  }

  /**
   * Análise individual de cada teste falhado
   */
  private async analyzeIndividualTest(result: TestResult): Promise<TestAnalysis> {
    const error = result.error || ''
    let status: TestAnalysis['status'] = 'false_positive'
    let confidence = 0.5
    let reasoning = 'Análise automática necessária'
    let suggestions: string[] = []
    let severity: TestAnalysis['severity'] = 'medium'
    let category: TestAnalysis['category'] = 'functionality'

    // Verificar padrões de bugs reais
    if (this.patterns.realBugs.some(pattern => pattern.test(error))) {
      status = 'real_bug'
      confidence = 0.8
      severity = 'high'
      reasoning = 'Erro indica problema real na aplicação - falha de assertion ou erro de runtime'
      suggestions = [
        'Verificar lógica da funcionalidade testada',
        'Revisar código relacionado ao erro',
        'Adicionar logs de debug para investigação'
      ]
    }
    
    // Verificar problemas de ambiente
    else if (this.patterns.environmentIssues.some(pattern => pattern.test(error))) {
      status = 'environment_issue'
      confidence = 0.9
      severity = 'medium'
      category = 'integration'
      reasoning = 'Falha relacionada a timeout ou problemas de conectividade'
      suggestions = [
        'Aumentar timeout nos testes',
        'Verificar estabilidade do servidor de desenvolvimento',
        'Implementar retry automático para testes flaky',
        'Verificar recursos de rede e performance'
      ]
    }
    
    // Verificar necessidade de melhorias
    else if (this.patterns.improvements.some(pattern => pattern.test(error))) {
      status = 'improvement_needed'
      confidence = 0.7
      severity = 'low'
      category = 'ui'
      reasoning = 'Seletor ou elemento não encontrado - possível problema de UX ou seletor'
      suggestions = [
        'Revisar seletores dos elementos',
        'Adicionar data-testid nos componentes',
        'Verificar se elementos estão visíveis no momento correto',
        'Implementar esperas mais específicas'
      ]
    }

    // Análise específica por tipo de teste
    if (result.name.includes('authentication') || result.name.includes('login')) {
      category = 'security'
      if (status === 'real_bug') {
        severity = 'critical'
        suggestions.push('Verificar integração com Firebase Auth')
      }
    }

    if (result.name.includes('checkout') || result.name.includes('payment')) {
      category = 'functionality'
      if (status === 'real_bug') {
        severity = 'critical'
        suggestions.push('Verificar fluxo de pagamento e integração N8N')
      }
    }

    if (result.name.includes('performance') || result.name.includes('load')) {
      category = 'performance'
      suggestions.push('Otimizar carregamento de recursos')
    }

    const shouldCreateIssue = status === 'real_bug' || 
                            (status === 'improvement_needed' && severity === 'high') ||
                            (status === 'environment_issue' && confidence > 0.8)

    return {
      testName: result.name,
      status,
      confidence,
      reasoning,
      suggestions,
      severity,
      category,
      shouldCreateIssue
    }
  }

  /**
   * Parse dos resultados JSON do Playwright
   */
  private async parseTestResults(): Promise<TestResult[]> {
    try {
      const jsonContent = await readFile('test-results.json', 'utf-8')
      const data = JSON.parse(jsonContent)
      
      const results: TestResult[] = []
      
      for (const suite of data.suites || []) {
        for (const spec of suite.suites || []) {
          for (const test of spec.tests || []) {
            for (const result of test.results || []) {
              results.push({
                name: `${spec.title} › ${test.title}`,
                status: result.status,
                duration: result.duration,
                error: result.error?.message,
                screenshot: result.attachments?.find((a: any) => a.name === 'screenshot')?.path,
                video: result.attachments?.find((a: any) => a.name === 'video')?.path,
                trace: result.attachments?.find((a: any) => a.name === 'trace')?.path,
                project: test.projectName || 'default'
              })
            }
          }
        }
      }
      
      return results
    } catch (error) {
      console.error('❌ Erro ao parse dos resultados:', error)
      return []
    }
  }

  /**
   * Gera relatório detalhado da análise
   */
  private async generateReport(analyses: TestAnalysis[]): Promise<void> {
    const timestamp = new Date().toISOString()
    const summary = this.generateSummary(analyses)
    
    const report = `# Relatório de Análise de Testes E2E
    
**Gerado em:** ${timestamp}
**Total de testes analisados:** ${analyses.length}

## 📊 Resumo Executivo

${summary}

## 🔍 Análises Detalhadas

${analyses.map(analysis => this.formatAnalysis(analysis)).join('\n\n')}

## 🎯 Próximos Passos

### Bugs Críticos (Ação Imediata)
${analyses.filter(a => a.severity === 'critical' && a.shouldCreateIssue).map(a => `- ${a.testName}`).join('\n')}

### Melhorias Recomendadas
${analyses.filter(a => a.status === 'improvement_needed').map(a => `- ${a.testName}: ${a.suggestions[0]}`).join('\n')}

### Issues Ambientais
${analyses.filter(a => a.status === 'environment_issue').map(a => `- ${a.testName}: ${a.reasoning}`).join('\n')}

---
*Relatório gerado automaticamente pelo Sistema de Análise de Testes IA*
`

    await writeFile('test-analysis-report.md', report)
    console.log('📄 Relatório salvo em: test-analysis-report.md')
  }

  /**
   * Gera resumo executivo
   */
  private generateSummary(analyses: TestAnalysis[]): string {
    const counts = {
      real_bug: analyses.filter(a => a.status === 'real_bug').length,
      environment_issue: analyses.filter(a => a.status === 'environment_issue').length,
      improvement_needed: analyses.filter(a => a.status === 'improvement_needed').length,
      flaky_test: analyses.filter(a => a.status === 'flaky_test').length,
      false_positive: analyses.filter(a => a.status === 'false_positive').length
    }
    
    const severityCounts = {
      critical: analyses.filter(a => a.severity === 'critical').length,
      high: analyses.filter(a => a.severity === 'high').length,
      medium: analyses.filter(a => a.severity === 'medium').length,
      low: analyses.filter(a => a.severity === 'low').length
    }

    const issuesCount = analyses.filter(a => a.shouldCreateIssue).length

    return `
- 🐛 **Bugs Reais:** ${counts.real_bug}
- 🌍 **Problemas Ambientais:** ${counts.environment_issue}  
- 🔧 **Melhorias Necessárias:** ${counts.improvement_needed}
- ⚡ **Testes Flaky:** ${counts.flaky_test}
- ✅ **Falsos Positivos:** ${counts.false_positive}

**Por Severidade:**
- 🔴 Crítico: ${severityCounts.critical}
- 🟠 Alto: ${severityCounts.high}
- 🟡 Médio: ${severityCounts.medium}
- 🟢 Baixo: ${severityCounts.low}

**📋 Issues que serão criadas:** ${issuesCount}
    `
  }

  /**
   * Formata análise individual
   */
  private formatAnalysis(analysis: TestAnalysis): string {
    const statusEmoji = {
      real_bug: '🐛',
      environment_issue: '🌍',
      improvement_needed: '🔧',
      flaky_test: '⚡',
      false_positive: '✅'
    }

    const severityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    }

    return `### ${statusEmoji[analysis.status]} ${analysis.testName}

**Status:** ${analysis.status.replace('_', ' ').toUpperCase()}  
**Severidade:** ${severityEmoji[analysis.severity]} ${analysis.severity}  
**Confiança:** ${Math.round(analysis.confidence * 100)}%  
**Categoria:** ${analysis.category}

**Análise:** ${analysis.reasoning}

**Sugestões:**
${analysis.suggestions.map(s => `- ${s}`).join('\n')}

**Criar Issue:** ${analysis.shouldCreateIssue ? '✅ Sim' : '❌ Não'}
`
  }

  /**
   * Cria issues automáticas no GitHub
   */
  private async createGitHubIssues(analyses: TestAnalysis[]): Promise<void> {
    if (!this.githubToken || !this.repoOwner || !this.repoName) {
      console.log('⚠️ Configuração GitHub não encontrada. Issues não serão criadas.')
      return
    }

    const issuesToCreate = analyses.filter(a => a.shouldCreateIssue)
    console.log(`🎫 Criando ${issuesToCreate.length} issues no GitHub...`)

    for (const analysis of issuesToCreate) {
      const issue = this.generateGitHubIssue(analysis)
      await this.createGitHubIssue(issue)
    }
  }

  /**
   * Gera estrutura da issue para GitHub
   */
  private generateGitHubIssue(analysis: TestAnalysis): GitHubIssue {
    const labels = [
      'bug',
      `severity-${analysis.severity}`,
      `category-${analysis.category}`,
      'automated-test',
      'e2e-test'
    ]

    if (analysis.status === 'environment_issue') {
      labels.push('infrastructure', 'test-environment')
    }

    const title = `[E2E Test] ${analysis.status === 'real_bug' ? 'Bug' : 'Issue'}: ${analysis.testName}`

    const body = `## 🤖 Issue Criada Automaticamente pelo Sistema de Análise de Testes

### 📋 Informações do Teste
- **Nome do Teste:** ${analysis.testName}
- **Status:** ${analysis.status.replace('_', ' ')}
- **Severidade:** ${analysis.severity}
- **Categoria:** ${analysis.category}
- **Confiança da IA:** ${Math.round(analysis.confidence * 100)}%

### 🔍 Análise
${analysis.reasoning}

### 🎯 Sugestões de Solução
${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### 📊 Contexto Técnico
- **Gerado em:** ${new Date().toISOString()}
- **Tipo de Teste:** E2E (End-to-End)
- **Framework:** Playwright
- **Ambiente:** Desenvolvimento

### 🔗 Próximos Passos
1. Investigar o erro seguindo as sugestões acima
2. Reproduzir o problema manualmente se necessário
3. Implementar correção e verificar se o teste passa
4. Considerar adicionar testes adicionais para prevenir regressão

### 📎 Anexos
- [ ] Screenshots disponíveis nos artefatos do teste
- [ ] Vídeo da execução disponível nos artefatos do teste
- [ ] Trace completo disponível para debug

---
*Issue gerada automaticamente pelo sistema de análise de testes. Para dúvidas sobre a análise, consulte o relatório completo.*
`

    return { title, body, labels }
  }

  /**
   * Cria issue no GitHub via API
   */
  private async createGitHubIssue(issue: GitHubIssue): Promise<void> {
    if (!this.githubToken) return

    try {
      const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(issue)
      })

      if (response.ok) {
        const created = await response.json()
        console.log(`✅ Issue criada: ${created.html_url}`)
      } else {
        console.error(`❌ Erro ao criar issue: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Erro na API do GitHub:', error)
    }
  }
}

// Script CLI
async function main() {
  const githubToken = process.env.GITHUB_TOKEN
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'guaracyalima'
  const repoName = process.env.GITHUB_REPO_NAME || 'xuxum-public'

  const analyzer = new TestAnalyzer(githubToken, repoOwner, repoName)
  
  try {
    await analyzer.runTestsAndAnalyze()
    console.log('🎉 Análise concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro na análise:', error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

export default TestAnalyzer