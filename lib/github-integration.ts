/**
 * @file lib/github-integration.ts
 * @description Integração específica com GitHub para análise de testes
 */

interface GitHubConfig {
  token: string
  owner: string
  repo: string
  apiUrl?: string
}

interface GitHubLabel {
  name: string
  color: string
  description: string
}

export class GitHubIntegration {
  private config: GitHubConfig
  private baseUrl: string

  constructor(config: GitHubConfig) {
    this.config = config
    this.baseUrl = config.apiUrl || 'https://api.github.com'
  }

  /**
   * Configura labels padrão para issues de testes
   */
  async setupTestLabels(): Promise<void> {
    const labels: GitHubLabel[] = [
      {
        name: 'automated-test',
        color: '0366d6',
        description: 'Issue criada automaticamente pelo sistema de testes'
      },
      {
        name: 'e2e-test',
        color: '1d76db',
        description: 'Relacionado a testes End-to-End'
      },
      {
        name: 'severity-critical',
        color: 'd73a49',
        description: 'Severidade crítica - ação imediata necessária'
      },
      {
        name: 'severity-high',
        color: 'f66a0a',
        description: 'Severidade alta'
      },
      {
        name: 'severity-medium',
        color: 'fbca04',
        description: 'Severidade média'
      },
      {
        name: 'severity-low',
        color: '28a745',
        description: 'Severidade baixa'
      },
      {
        name: 'category-functionality',
        color: '5319e7',
        description: 'Problemas de funcionalidade'
      },
      {
        name: 'category-performance',
        color: 'e99695',
        description: 'Problemas de performance'
      },
      {
        name: 'category-ui',
        color: 'f9d0c4',
        description: 'Problemas de interface'
      },
      {
        name: 'category-integration',
        color: 'c2e0c6',
        description: 'Problemas de integração'
      },
      {
        name: 'category-security',
        color: 'ff6b6b',
        description: 'Problemas de segurança'
      },
      {
        name: 'test-environment',
        color: '0052cc',
        description: 'Problemas relacionados ao ambiente de teste'
      },
      {
        name: 'infrastructure',
        color: '006b75',
        description: 'Problemas de infraestrutura'
      }
    ]

    for (const label of labels) {
      await this.createOrUpdateLabel(label)
    }
  }

  /**
   * Verifica se uma issue similar já existe
   */
  async findSimilarIssue(testName: string): Promise<number | null> {
    try {
      const query = `repo:${this.config.owner}/${this.config.repo} is:issue "${testName}" label:automated-test`
      const response = await this.makeRequest(`/search/issues?q=${encodeURIComponent(query)}`)
      
      if (response.items && response.items.length > 0) {
        return response.items[0].number
      }
      
      return null
    } catch (error) {
      console.warn('⚠️ Erro ao buscar issues similares:', error)
      return null
    }
  }

  /**
   * Cria ou atualiza uma issue
   */
  async createOrUpdateIssue(testName: string, issueData: any): Promise<string> {
    const existingIssue = await this.findSimilarIssue(testName)
    
    if (existingIssue) {
      // Atualizar issue existente com novo comentário
      await this.addIssueComment(existingIssue, this.generateUpdateComment(issueData))
      return `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues/${existingIssue}`
    } else {
      // Criar nova issue
      const response = await this.makeRequest(`/repos/${this.config.owner}/${this.config.repo}/issues`, {
        method: 'POST',
        body: JSON.stringify(issueData)
      })
      return response.html_url
    }
  }

  /**
   * Adiciona comentário a uma issue
   */
  private async addIssueComment(issueNumber: number, body: string): Promise<void> {
    await this.makeRequest(`/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body })
    })
  }

  /**
   * Gera comentário de atualização
   */
  private generateUpdateComment(analysisData: any): string {
    return `## 🔄 Atualização Automática - ${new Date().toISOString()}

O teste **${analysisData.testName}** falhou novamente com análise similar.

### Nova Análise:
${analysisData.reasoning}

### Sugestões Adicionais:
${analysisData.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

---
*Comentário gerado automaticamente pelo sistema de análise de testes*`
  }

  /**
   * Cria ou atualiza um label
   */
  private async createOrUpdateLabel(label: GitHubLabel): Promise<void> {
    try {
      // Tentar atualizar label existente
      await this.makeRequest(`/repos/${this.config.owner}/${this.config.repo}/labels/${label.name}`, {
        method: 'PATCH',
        body: JSON.stringify(label)
      })
    } catch (error) {
      // Se não existir, criar novo
      try {
        await this.makeRequest(`/repos/${this.config.owner}/${this.config.repo}/labels`, {
          method: 'POST',
          body: JSON.stringify(label)
        })
      } catch (createError) {
        console.warn(`⚠️ Erro ao criar label ${label.name}:`, createError)
      }
    }
  }

  /**
   * Faz requisição para API do GitHub
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Obtém estatísticas do repositório para contexto
   */
  async getRepoStats(): Promise<any> {
    try {
      const repo = await this.makeRequest(`/repos/${this.config.owner}/${this.config.repo}`)
      const issues = await this.makeRequest(`/repos/${this.config.owner}/${this.config.repo}/issues?labels=automated-test&state=all`)
      
      return {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
        automatedIssues: issues.length,
        language: repo.language,
        size: repo.size
      }
    } catch (error) {
      console.warn('⚠️ Erro ao obter estatísticas do repo:', error)
      return {}
    }
  }
}