// test-api.js - Script para testar a função fetchFromExternalAPI()
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Carrega as variáveis de ambiente
dotenv.config();

console.log('Variáveis de ambiente:');
console.log(`FINANCIAL_INSTITUTION_API_URL_1: ${process.env.FINANCIAL_INSTITUTION_API_URL_1}`);
console.log(`FINANCIAL_INSTITUTION_API_KEY_1: ${process.env.FINANCIAL_INSTITUTION_API_KEY_1}`);
console.log(`FINANCIAL_INSTITUTION_TIMEOUT_1: ${process.env.FINANCIAL_INSTITUTION_TIMEOUT_1}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI}\n`);

// Só importa o service se as variáveis estiverem carregadas
if (process.env.FINANCIAL_INSTITUTION_API_URL_1) {
    console.log('Variáveis carregadas! Importando service...\n');
    
    const { default: FinancialInstitutionService } = await import('../services/financialInstitutionServices.js');
    
    async function testFetchFromExternalAPI() {
        console.log('🔍 Executando service - "fetchFromExternalAPI()"');
        
        try {
            const startTime = Date.now();
            const institution = await FinancialInstitutionService.fetchFromExternalAPI();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log('✅ Dados recebidos da API externa:');
            console.log(`   ⏱️  Tempo de resposta: ${duration}ms`);
            
            if (institution && institution.id) {
                console.log('\n📋 Dados da instituição recebida:');
                console.log('   institution:', institution);
            } else {
                console.log('   Nenhuma instituição encontrada ou dados inválidos');
            }
            
            console.log('\n🎉 Teste fetchFromExternalAPI() concluído com sucesso!\n');
            return institution;
            
        } catch (error) {
            console.error('❌ Erro durante o teste fetchFromExternalAPI():');
            console.error(`   Tipo: ${error.name || 'Error'}`);
            console.error(`   Mensagem: ${error.message}`);
            
            if (error.cause) {
                console.error(`   Causa: ${error.cause}`);
            }
            
            console.log('\n🔧 Possíveis soluções:');
            console.log('   1. Verificar se a API externa está rodando na porta 7856');
            console.log('   2. Confirmar URL e API Key no arquivo .env');
            console.log('   3. Verificar conectividade de rede');
            console.log('   4. Testar a URL manualmente: curl http://localhost:7856/openfinance/institution');
            throw error;
        }
    }

    async function testSyncInstitution() {
        console.log('🔄 Executando service - "syncInstitution()"');
        
        try {
            const startTime = Date.now();
            
            // Teste 1: Sincronização geral (todas as instituições)
            console.log('\n📥 Teste 1: Sincronização geral...');
            const syncResult = await FinancialInstitutionService.syncInstitution();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log('✅ Sincronização concluída:');
            console.log(`   ⏱️  Tempo de execução: ${duration}ms`);
            console.log(`   📊 Estatísticas da sincronização:`);
            console.log(`      - Criadas: ${syncResult.created}`);
            console.log(`      - Atualizadas: ${syncResult.updated}`);
            console.log(`      - Erros: ${syncResult.errors.length}`);
            console.log(`      - Data da sincronização: ${syncResult.syncDate}`);
            
            if (syncResult.errors.length > 0) {
                console.log('\n⚠️  Erros encontrados:');
                syncResult.errors.forEach((error, index) => {
                    console.log(`   ${index + 1}. Instituição ${error.institutionId}: ${error.error}`);
                });
            }

            // Teste 2: Sincronização específica por ID (se houver dados)
            if (syncResult.created > 0 || syncResult.updated > 0) {
                console.log('\n📥 Teste 2: Sincronização específica por ID...');
                
                // Busca uma instituição para testar sincronização específica
                const institutions = await FinancialInstitutionService.getAllInstitutions({ limit: 1 });
                
                if (institutions.length > 0) {
                    const testInstitutionId = institutions[0].id;
                    console.log(`   🎯 Testando sincronização da instituição: ${testInstitutionId}`);
                    
                    const specificSyncResult = await FinancialInstitutionService.syncInstitution(testInstitutionId);
                    
                    console.log('   ✅ Sincronização específica concluída:');
                    console.log(`      - Criadas: ${specificSyncResult.created}`);
                    console.log(`      - Atualizadas: ${specificSyncResult.updated}`);
                    console.log(`      - Erros: ${specificSyncResult.errors.length}`);
                }
            }

            console.log('\n🎉 Teste syncInstitution() concluído com sucesso!\n');
            return syncResult;
            
        } catch (error) {
            console.error('❌ Erro durante o teste syncInstitution():');
            console.error(`   Tipo: ${error.name || 'Error'}`);
            console.error(`   Mensagem: ${error.message}`);
            
            if (error.cause) {
                console.error(`   Causa: ${error.cause}`);
            }
            
            console.log('\n🔧 Possíveis soluções:');
            console.log('   1. Verificar conexão com MongoDB');
            console.log('   2. Verificar se a API externa está respondendo');
            console.log('   3. Verificar permissões de escrita no banco de dados');
            console.log('   4. Verificar logs do MongoDB para erros específicos');
            throw error;
        }
    }
    
    // Executa os testes em sequência
    console.log('🚀 Iniciando bateria de testes...\n');
    
    try {
        // Inicializa conexão MongoDB
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB conectado!\n');
        
        // Teste 1: fetchFromExternalAPI
        await testFetchFromExternalAPI();
        
        // Teste 2: syncInstitution
        await testSyncInstitution();
        
        console.log('🎊 Todos os testes concluídos com sucesso!');
        
    } catch (error) {
        console.error('\n💥 Falha na execução dos testes:', error.message);
        process.exit(1);
    } finally {
        // Fecha conexão MongoDB
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('\n🔌 Conexão MongoDB fechada');
        }
    }
    
} else {
    console.error('❌ Variáveis de ambiente não carregadas!');
    console.log('🔧 Verifique se o arquivo .env existe e está no diretório correto.');
}