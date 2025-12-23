#!/usr/bin/env node

require('dotenv').config()
require('dotenv').config({ path: '.env.local' })

const https = require('https')

async function testGitHubToken() {
  const token = process.env.GITHUB_TOKEN
  console.log(`🔑 Token: ${token ? token.substring(0, 8) + '...' : 'undefined'}`)
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/user',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'xeco-test-analyzer'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`)
        console.log(`📋 Response: ${data.substring(0, 200)}`)
        
        if (res.statusCode === 200) {
          const user = JSON.parse(data)
          console.log(`✅ Token válido para usuário: ${user.login}`)
        } else {
          console.log(`❌ Token inválido ou sem permissões`)
        }
      })
    })

    req.on('error', (error) => {
      console.log(`💥 Erro na requisição: ${error.message}`)
    })
    
    req.end()
  })
}

testGitHubToken().catch(console.error)