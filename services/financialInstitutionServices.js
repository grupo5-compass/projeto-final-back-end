// services/financialInstitutionServices.js
import FinancialInstitution from "../models/FinancialInstitutionModel.js";

class FinancialInstitutionService {
    constructor() {
        this.apiUrl = process.env.FINANCIAL_INSTITUTION_API_URL_1;
        this.apiKey = process.env.FINANCIAL_INSTITUTION_API_KEY_1;
        this.timeout =
            parseInt(process.env.FINANCIAL_INSTITUTION_TIMEOUT_1) || 5000;
    }

    /**
     * Busca dados da API externa de instituições financeiras
     * @returns {Promise<Array>} Lista de instituições da API externa
     */
    async fetchFromExternalAPI() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                this.timeout
            );

            const response = await fetch(`${this.apiUrl}/institution`, {
                method: "GET",
                headers: {
                    "x-api-key": this.apiKey,
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(
                    `Erro na API externa: ${response.status} - ${response.statusText}`
                );
            }

            const data = await response.json();
            return data || {};
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error(
                    `Timeout na requisição para API externa (${this.timeout}ms)`
                );
            }
            console.error("Erro ao buscar dados da API externa:", error);
            throw new Error(
                `Erro ao conectar com API externa: ${error.message}`
            );
        }
    }

    /**
     * Sincroniza dados locais com a API externa
     * @param {string} institutionId - ID específico da instituição (opcional)
     * @returns {Promise<Object>} Resultado da sincronização
     */
    async syncInstitution(institutionId = null) {
        try {
            const externalData = await this.fetchFromExternalAPI();

            if (!externalData) {
                throw new Error("Nenhum dado retornado da API externa");
            }

            let syncResults = {
                created: 0,
                updated: 0,
                errors: [],
                syncDate: new Date(),
            };

            // Normaliza os dados para sempre trabalhar com array
            const normalizedData = Array.isArray(externalData) ? externalData : [externalData];

            if (normalizedData.length === 0) {
                throw new Error("Nenhum dado válido retornado da API externa");
            }

            // Se institutionId específico foi fornecido, filtra apenas essa instituição
            const dataToSync = institutionId
                ? normalizedData.filter((inst) => inst.id === institutionId)
                : normalizedData;

            if (institutionId && dataToSync.length === 0) {
                throw new Error(
                    `Instituição ${institutionId} não encontrada na API externa`
                );
            }

            for (const institutionData of dataToSync) {
                try {
                    // Verifica se a instituição já existe
                    const existingInstitution =
                        await FinancialInstitution.findOne({
                            id: institutionData.id,
                        });

                    if (existingInstitution) {
                        // Atualiza instituição existente
                        existingInstitution.nome =
                            institutionData.name || institutionData.nome || existingInstitution.nome;
                        existingInstitution.status =
                            institutionData.status !== undefined
                                ? institutionData.status
                                : existingInstitution.status;

                        await existingInstitution.updateLastSync();
                        await existingInstitution.save();
                        syncResults.updated++;
                    } else {
                        // Cria nova instituição
                        const newInstitution = new FinancialInstitution({
                            id: institutionData.id,
                            nome: institutionData.name || institutionData.nome,
                            status: institutionData.status || false,
                            lastSync: new Date(),
                        });

                        await newInstitution.save();
                        syncResults.created++;
                    }
                } catch (error) {
                    console.error(
                        `Erro ao sincronizar instituição ${institutionData.id}:`,
                        error
                    );
                    syncResults.errors.push({
                        institutionId: institutionData.id,
                        error: error.message,
                    });
                }
            }

            return syncResults;
        } catch (error) {
            console.error("Erro na sincronização:", error);
            throw new Error(
                `Erro ao sincronizar instituições: ${error.message}`
            );
        }
    }

    /**
     * Busca todas as instituições do banco local
     * @param {Object} options - Opções de busca (limit, skip, sort)
     * @returns {Promise<Array>} Lista de todas as instituições
     */
    async getAllInstitutions(options = {}) {
        try {
            const {
                limit = null,
                skip = 0,
                sort = { createdAt: -1 },
                select = null,
            } = options;

            let query = FinancialInstitution.find({});

            if (select) {
                query = query.select(select);
            }

            if (sort) {
                query = query.sort(sort);
            }

            if (skip > 0) {
                query = query.skip(skip);
            }

            if (limit) {
                query = query.limit(limit);
            }

            const institutions = await query.exec();
            return institutions;
        } catch (error) {
            console.error("Erro ao buscar todas as instituições:", error);
            throw new Error("Erro ao buscar instituições do banco de dados");
        }
    }

    /**
     * Busca apenas instituições ativas
     * @param {Object} options - Opções de busca (limit, skip, sort)
     * @returns {Promise<Array>} Lista de instituições ativas
     */
    async getActiveInstitutions(options = {}) {
        try {
            const {
                limit = null,
                skip = 0,
                sort = { createdAt: -1 },
                select = null,
            } = options;

            let query = FinancialInstitution.findActive();

            if (select) {
                query = query.select(select);
            }

            if (sort) {
                query = query.sort(sort);
            }

            if (skip > 0) {
                query = query.skip(skip);
            }

            if (limit) {
                query = query.limit(limit);
            }

            const activeInstitutions = await query.exec();
            return activeInstitutions;
        } catch (error) {
            console.error("Erro ao buscar instituições ativas:", error);
            throw new Error(
                "Erro ao buscar instituições ativas do banco de dados"
            );
        }
    }

    /**
     * Busca uma instituição específica por ID
     * @param {string} institutionId - ID da instituição
     * @returns {Promise<Object|null>} Dados da instituição ou null se não encontrada
     */
    async getInstitutionById(institutionId) {
        try {
            const institution = await FinancialInstitution.findByInstitutionId(
                institutionId
            );
            return institution;
        } catch (error) {
            console.error(
                `Erro ao buscar instituição ${institutionId}:`,
                error
            );
            throw new Error("Erro ao buscar instituição específica");
        }
    }

    /**
     * Atualiza o status de uma ou múltiplas instituições
     * @param {string|Array} institutionIds - ID(s) da(s) instituição(ões)
     * @param {boolean} newStatus - Novo status
     * @returns {Promise<Object>} Resultado da atualização
     */
    async updateInstitutionStatus(institutionIds, newStatus) {
        try {
            const ids = Array.isArray(institutionIds)
                ? institutionIds
                : [institutionIds];

            const result = await FinancialInstitution.updateStatusBatch(
                ids,
                newStatus
            );

            return {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount,
                success: result.modifiedCount > 0,
            };
        } catch (error) {
            console.error("Erro ao atualizar status das instituições:", error);
            throw new Error("Erro ao atualizar status das instituições");
        }
    }

    /**
     * Obtém estatísticas das instituições
     * @returns {Promise<Object>} Estatísticas das instituições
     */
    async getInstitutionStats() {
        try {
            const [total, active, inactive, recentlyUpdated] =
                await Promise.all([
                    FinancialInstitution.countDocuments({}),
                    FinancialInstitution.countDocuments({ status: true }),
                    FinancialInstitution.countDocuments({ status: false }),
                    FinancialInstitution.countDocuments({
                        lastSync: {
                            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        }, // Últimas 24h
                    }),
                ]);

            return {
                total,
                active,
                inactive,
                recentlyUpdated,
                lastUpdated: new Date(),
            };
        } catch (error) {
            console.error("Erro ao obter estatísticas:", error);
            throw new Error("Erro ao obter estatísticas das instituições");
        }
    }
}

export default new FinancialInstitutionService();
