#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
require('dotenv').config()

async function testImageUpload() {
  console.log('🧪 Testando upload de imagem para GitHub...')
  
  const githubToken = process.env.GITHUB_TOKEN
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'guaracyalima'
  const repoName = process.env.GITHUB_REPO_NAME || 'xeco-public'
  
  console.log(`📊 Configuração:`)
  console.log(`   - Repo: ${repoOwner}/${repoName}`)
  console.log(`   - Token: ${githubToken ? '✅ Configurado' : '❌ Não configurado'}`)
  
  // Procurar screenshot
  const testResultsDir = path.join(process.cwd(), 'test-results')
  const screenshotPath = path.join(testResultsDir, 'navigation.e2e-BottomTabBa-14d2d-o-entre-tabs-deve-funcionar-chromium/test-failed-1.png')
  
  if (!fs.existsSync(screenshotPath)) {
    console.log('❌ Screenshot não encontrado:', screenshotPath)
    return
  }
  
  const fileStats = fs.statSync(screenshotPath)
  console.log(`📸 Screenshot encontrado: ${Math.round(fileStats.size/1024)}KB`)
  
  try {
    // Ler arquivo e converter para base64
    const fileBuffer = fs.readFileSync(screenshotPath)
    const fileBase64 = fileBuffer.toString('base64')
    
    console.log('📤 Enviando para GitHub...')
    
    const timestamp = Date.now()
    const uploadPath = `screenshots/test-upload-${timestamp}.png`
    
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${uploadPath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🧪 Teste de upload automático - ${new Date().toISOString()}`,
        content: fileBase64
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Upload realizado com sucesso!')
      console.log('🔗 URL:', result.content.download_url)
      
      // Criar issue de teste com imagem
      console.log('📝 Criando issue de teste...')
      
      const issueResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `🧪 Teste de Upload de Screenshot - ${new Date().toLocaleString('pt-BR')}`,
          body: `## 🧪 Teste Automático de Upload

Esta issue foi criada automaticamente para testar o upload de screenshots.

## 📸 Screenshot Anexado
![Screenshot do teste](${result.content.download_url})

**Detalhes:**
- Arquivo: \`${uploadPath}\`  
- Tamanho: ${Math.round(fileStats.size/1024)}KB
- Data: ${new Date().toLocaleString('pt-BR')}

---
*Issue criada automaticamente pelo sistema de teste*`,
          labels: ['test', 'screenshot-upload', 'automated']
        })
      })
      
      if (issueResponse.ok) {
        const issue = await issueResponse.json()
        console.log('✅ Issue criada:', issue.html_url)
      } else {
        console.log('❌ Falha ao criar issue:', issueResponse.status)
      }
      
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.log('❌ Falha no upload:', response.status, errorData.message)
    }
    
  } catch (error) {
    console.log('💥 Erro:', error.message)
  }
}

testImageUpload().catch(console.error)