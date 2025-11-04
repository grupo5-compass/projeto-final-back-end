// testConsentService1.js
import dotenv from 'dotenv';
// Carrega variáveis do .env (opcional)
dotenv.config();
import consentService from './services/consentServices.js';

// Testa: fetchFromExternalAPI
(async () => {
  try {
    console.log('🔍 Testando conexão com a API real...');
    const data = await consentService.fetchFromExternalAPI();
    console.log('✅ Dados recebidos da API:', data);
  } catch (error) {
    console.error('❌ Erro ao testar a API:', error.message);
  }
})();