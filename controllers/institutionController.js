import institutionService from "../services/institutionServices.js";
import customerService from "../services/customerServices.js";
import consentService from "../services/consentServices.js";

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
        
        const institutions = await institutionService.getActiveInstitutions(options);

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
        const syncResult = await institutionService.syncInstitution();

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

/**
 * @desc    Listar instituições ligadas ao CPF do usuário autenticado
 * @route   GET /api/institutions/me
 * @access  Protegido (JWT) com segurança por CPF
 */
export const getMyInstitutions = async (req, res) => {
    try {
        const cpf = req?.LoggedUser?.cpf;
        if (!cpf) {
            //Ajustado para retornar um json de erro padrão em vez de lançar um erro genérico para melhor controle
            return res.status(403).json({ error: "CPF ausente no token." });
        }
        //Busca o cliente local
        const customer = await customerService.getCustomerByCpf(cpf);
        if (!customer) {
            return res.status(404).json({ error: "Cliente não encontrado para este CPF." });
        }

        //Busca os consents ativos do cliente
        const activeConsents = await consentService.getActiveConsentsByCustomerId(customer._id);

        // Se não houver consents ativos, não há instituições vinculadas
        if (!activeConsents || activeConsents.length === 0) {
            return res.status(200).json([]);
        }

        //Extraí os ids das instituições dos consentimentos
        //Baseado no modelo de consentimento que vincula cliente -> instituição
        const myInstitutionIds = activeConsents.map(c => c.institutionId);

        // Por ora, retornamos as instituições ativas disponíveis.
        // Em ambientes com múltiplas IFs, poderemos mapear consents -> instituições.
        const options = { select: 'id nome status', sort: { id: 1 } };
        const allActiveInstitutions = await institutionService.getActiveInstitutions(options);

        // Filtra apenas as instituições vinculadas ao usuário
        const myInstitutions = allActiveInstitutions.filter(inst =>
             myInstitutionIds.includes(inst.id)
        );

        return res.status(200).json(myInstitutions);
    } catch (error) {
        console.error("Erro ao listar instituições do usuário:", error.message);
        return res.status(error.statusCode || 500).json(error.message);
    }
};