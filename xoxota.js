const crypto = require('crypto');

// ⚠️ IMPORTANTE: Deve ser EXATAMENTE igual ao .env do Next.js
const HMAC_SECRET = "xeco-hmac-secret-production-2025-change-me-in-prod";

// Pega os dados do body
const body = $input.item.json.body;

console.log('🔐 N8N - Validando assinatura HMAC...');
console.log('🔐 N8N - Secret sendo usado:', HMAC_SECRET);
console.log('🔐 N8N - Secret length:', HMAC_SECRET.length);

// ⚠️ ESTRUTURA DEVE SER IDÊNTICA AO FRONTEND/BACKEND
const dataToValidate = {
  companyId: body.companyId,
  totalAmount: body.totalAmount,
  items: body.productList.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice
  }))
};

console.log('🔐 N8N - Dados para validar:', JSON.stringify(dataToValidate));

// Gera a assinatura esperada
const dataString = JSON.stringify(dataToValidate);
console.log('🔐 N8N - Data string:', dataString);

const expectedSignature = crypto
  .createHmac('sha256', HMAC_SECRET)
  .update(dataString)
  .digest('hex');

console.log('🔐 N8N - Assinatura esperada:', expectedSignature);
console.log('🔐 N8N - Assinatura recebida:', body.signature);

const isValid = expectedSignature === body.signature;

console.log('🔐 N8N - Assinatura válida?', isValid);

return {
  signatureValid: isValid,
  expectedSignature: expectedSignature,
  receivedSignature: body.signature,
  dataUsed: dataToValidate
};