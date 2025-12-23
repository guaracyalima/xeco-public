#!/usr/bin/env node

require('dotenv').config()
require('dotenv').config({ path: '.env.local' })

const https = require('https')

async function testCreateIssue() {
  const token = process.env.GITHUB_TOKEN
  const repoOwner = 'guaracyalima'
  const repoName = 'xeco-public'
  
  console.log(`🔑 Token: ${token ? token.substring(0, 8) + '...' : 'undefined'}`)
  
  const issueData = {
    title: '🧪 Teste de Criação de Issue - ' + new Date().toLocaleString('pt-BR'),
    body: 'Esta é uma issue de teste criada automaticamente para verificar permissões.',
    labels: ['test', 'automated']
  }
  
  const postData = JSON.stringify(issueData)
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoOwner}/${repoName}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'xeco-test-analyzer'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`)
        
        if (res.statusCode === 201) {
          const issue = JSON.parse(data)
          console.log(`✅ Issue criada: #${issue.number} - ${issue.html_url}`)
        } else {
          console.log(`❌ Falha ao criar issue`)
          console.log(`📋 Response: ${data}`)
        }
      })
    })

    req.on('error', (error) => {
      console.log(`💥 Erro na requisição: ${error.message}`)
    })
    
    req.write(postData)
    req.end()
  })
}

testCreateIssue().catch(console.error)