#!/usr/bin/env node

/**
 * @file src/utils/test-analyzer.ts
 * @description Análise rápida de resultados de teste com IA
 */

import fs from 'fs'
import path from 'path'

interface TestResult {
  title: string
  status: 'passed' | 'failed' | 'skipped'
  duration?: number
  error?: {
    message: string
    location?: string
  }
}

interface TestSuite {
  suites: Array<{
    title: string
    tests: TestResult[]
  }>
  stats: {
    passed: number
    failed: number
    skipped: number
    duration: number
  }
}

async function analyzeTestResults() {
  const resultsPath = path.join(process.cwd(), 'test-results.json')
  
  if (!fs.existsSync(resultsPath)) {
    console.log('❌ Arquivo test-results.json não encontrado')
    return
  }

  try {
    const rawData = fs.readFileSync(resultsPath, 'utf8')
    const results = JSON.parse(rawData)
    
    console.log('\n🔍 ANÁLISE RÁPIDA DE TESTES\n')
    
    // Estatísticas básicas
    const stats = results.stats || {}
    console.log(`✅ Passou: ${stats.expected || 0}`)
    console.log(`❌ Falhou: ${stats.unexpected || 0}`)
    console.log(`⏭️  Pulou: ${stats.skipped || 0}`)
    
    // Análise dos testes que falharam
    const failedTests = results.suites?.flatMap((suite: any) => 
      suite.specs?.flatMap((spec: any) => 
        spec.tests?.filter((test: any) => test.results?.[0]?.status === 'failed') || []
      ) || []
    ) || []

    if (failedTests.length === 0 && stats.unexpected === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!')
      console.log('✨ Sistema funcionando perfeitamente!')
      return
    }

    console.log('\n🐛 FALHAS DETECTADAS:\n')
    
    failedTests.forEach((test: any, index: number) => {
      const error = test.results?.[0]?.error
      console.log(`${index + 1}. ${test.title}`)
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase()
        
        // Análise simples baseada na mensagem de erro
        if (errorMsg.includes('timeout') || errorMsg.includes('test ended')) {
          console.log('   🔍 TIPO: Possível problema de performance/timeout')
          console.log('   💡 SUGESTÃO: Aumentar timeout ou otimizar carregamento')
        } else if (errorMsg.includes('locator') || errorMsg.includes('not found')) {
          console.log('   🔍 TIPO: Elemento não encontrado')
          console.log('   💡 SUGESTÃO: Verificar se o elemento existe na página')
        } else if (errorMsg.includes('navigation') || errorMsg.includes('goto')) {
          console.log('   🔍 TIPO: Problema de navegação')
          console.log('   💡 SUGESTÃO: Verificar se a URL está correta')
        } else {
          console.log('   🔍 TIPO: Erro genérico')
          console.log('   💡 SUGESTÃO: Investigar logs detalhados')
        }
        
        // Primeira linha do erro para contexto
        const firstLine = error.message.split('\n')[0]
        console.log(`   📝 ERRO: ${firstLine}`)
      }
      console.log('')
    })

    // Recomendação final
    if (failedTests.length > 0) {
      console.log('🚨 RECOMENDAÇÃO: Execute com --headed para ver o que acontece no browser')
      console.log('📋 COMANDO: npx playwright test tests/quick-smoke.e2e.spec.ts --headed')
    }

  } catch (error) {
    console.error('❌ Erro ao analisar resultados:', error)
  }
}

analyzeTestResults()