import financialInstitutionService from "../services/financialInstitutionServices.js";

/**
 * @desc    Listar instituições financeiras ativas
 * @route   GET /api/institutions
 * @access  Público/Autenticado (usado pelo frontend para exibir a lista de bancos)
 */
export const listInstitutions = async (req, res) => {
    try {
        // lista simples (id, nome, status).
        // Buscamos apenas as IFs 'ativas' do nosso banco local (cache).
        const options = {
            select: 'id nome status', // Seleciona apenas os campos necessários
            sort: { id: 1 }      // Ordena por id (if_001, if_002...)
        };
        
        const institutions = await financialInstitutionService.getActiveInstitutions(options);

        // Retorna a lista para o frontend.
        // Se 'institutions' estiver vazio, retorna [] (lista vazia),
        // o que atende ao requisito.
        res.status(200).json(institutions);

    } catch (error) {
        console.error("Erro ao listar instituições:", error.message);
        res.status(500).json({ message: "Erro interno ao buscar instituições." });
    }
};

/**
 * @desc    Forçar sincronização com a API externa (Fase 2)
 * @route   POST /api/institutions/sync
 * @access  Protegido (Admin/Sistema)
 */
export const syncInstitutions = async (req, res) => {
    try {
        console.log("Iniciando sincronização manual de instituições...");
        
        // Chama o serviço que:
        // 1. Busca dados da API externa (Fase 2)
        // 2. Salva/Atualiza no banco de dados local (Fase 3)
        const syncResult = await financialInstitutionService.syncInstitution();

        console.log("Sincronização concluída:", syncResult);
        
        // Retorna o relatório da sincronização
        res.status(200).json({
            message: "Sincronização concluída com sucesso.",
            details: syncResult
        });

    } catch (error) {
        console.error("Erro ao sincronizar instituições:", error.message);
        
        // Erro específico se a API externa (IF) falhar ou der timeout
        if (error.message.includes("Timeout") || error.message.includes("API externa") || error.message.includes("fetch")) {
            return res.status(504).json({ 
                message: "Gateway Timeout: A API da instituição financeira não respondeu ou está offline.",
                error: error.message
            });
        }
        
        // Outros erros (ex: falha no nosso DB)
        res.status(500).json({ message: "Erro interno ao sincronizar instituições." });
    }
};