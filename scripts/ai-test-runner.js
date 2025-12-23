#!/usr/bin/env node

/**
 * @file scripts/ai-test-runner.js
 * @description CLI simplificado para execução do analisador de testes
 */

const { spawn } = require('child_process')
const path = require('path')

// Configurações do ambiente
const config = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER || 'guaracyalima',
  GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME || 'xuxum-public'
}

console.log('🚀 Iniciando Sistema de Análise de Testes com IA...')
console.log('📊 Configuração:')
console.log(`   - Repo: ${config.GITHUB_REPO_OWNER}/${config.GITHUB_REPO_NAME}`)
console.log(`   - GitHub Token: ${config.GITHUB_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`)
console.log('')

// Executar o analisador usando tsx
const scriptPath = path.join(__dirname, 'test-analyzer.ts')
const child = spawn('npx', ['tsx', scriptPath], {
  stdio: 'inherit',
  env: { ...process.env, ...config }
})

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 Análise concluída com sucesso!')
    console.log('📄 Verifique o arquivo test-analysis-report.md para detalhes')
    
    if (config.GITHUB_TOKEN) {
      console.log('🎫 Issues criadas automaticamente no GitHub (se necessário)')
    } else {
      console.log('💡 Para criar issues automaticamente, configure GITHUB_TOKEN')
    }
  } else {
    console.error(`\n❌ Processo encerrado com código: ${code}`)
    process.exit(code)
  }
})