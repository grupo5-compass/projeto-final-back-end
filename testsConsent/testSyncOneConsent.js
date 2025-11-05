// testsConsent/testSyncOneConsent.js
import connectDB from '../config/db.js';
import ConsentService from "../services/consentServices.js";

// Função de teste principal
async function runTests() {
    connectDB();
    console.log('=== Iniciando testes da função syncOneConsentFromApi ===\n');

    // Caso 1: Consentimento encontrado na API
    const result1 = await ConsentService.syncOneConsentFromApi('consent_001');
    console.log('Resultado 1 (esperado "active"): ', result1, '\n');

    // Caso 2: Consentimento não encontrado (404)
    const result2 = await ConsentService.syncOneConsentFromApi('consent_002');
    console.log('Resultado 2 (esperado "active"): ', result2, '\n');

    // Caso 3: Acesso negado (403)
    const result3 = await ConsentService.syncOneConsentFromApi('consent_003');
    console.log('Resultado 3 (esperado "revoked"): ', result3, '\n');

    // Caso 4: Erro genérico
    const result4 = await ConsentService.syncOneConsentFromApi('consent_erro');
    console.log('Resultado 4 (esperado null): ', result4, '\n');
}

// Executa os testes
runTests();
