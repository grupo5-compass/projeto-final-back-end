// services/consentServices.js
import Consent from '../models/ConsentModel.js';

class ConsentService {
    constructor() {
        this.apiUrl = process.env.FINANCIAL_INSTITUTION_API_URL_1;
        this.apiKey = process.env.FINANCIAL_INSTITUTION_API_KEY_1;
        this.timeout = parseInt(process.env.FINANCIAL_INSTITUTION_TIMEOUT_1) || 5000;
    }

    /** ----------  FUNÇÕES UTILITÁRIAS ---------- */

    async fetchWithTimeout(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                ...options,
                headers: {
                    "x-api-key": this.apiKey,
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return this.handleApiResponse(response);
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error(`Timeout na requisição (${this.timeout}ms)`);
            }
            throw error;
        }
    }

    async handleApiResponse(response) {
        if (!response.ok) {
            const message = `Erro na API externa: ${response.status} - ${response.statusText}`;
            throw new Error(message);
        }
        return response.json();
    }

    /** ----------  API EXTERNA ---------- */

    /**
     * Busca consentimentos da API externa pela rota /consents
     * @returns {Promise<Array>} Lista de consentimentos
     */
    async fetchFromExternalAPI() {
        try {
            const consents = await this.fetchWithTimeout("/consents", { method: "GET" });
            return Array.isArray(consents) ? consents : [consents];
        } catch (error) {
            console.error("Erro ao buscar consentimentos da API externa:", error.message);
            throw error;
        }
    }

        /** ----------  SINCRONIZAÇÃO pela rota GET /consents ---------- */

    /**
     * Sincroniza consentimentos locais com a API externa provindos da rota /consents
     * @returns {Promise<Object>} Resultado da sincronização
     */
    async syncConsent() {
        try {
            const consentArray = await this.fetchFromExternalAPI();
            const syncResults = { created: 0, updated: 0, revoked: 0, errors: [], syncDate: new Date() };

            await Promise.all(consentArray.map(async consent => {
                const success = await this.saveConsent(consent, 'active');
                if (success) syncResults.updated++;
                else syncResults.errors.push(consent._id);
            }));

            const revokedConsents = await this.getRevokedConsents(consentArray);
            for (const consent of revokedConsents) {
                await this.saveConsent(consent, 'revoked');
                syncResults.revoked++;
            }

            return syncResults;
        } catch (error) {
            console.error("Erro na sincronização:", error.message);
            throw new Error(`Erro ao sincronizar consentimentos: ${error.message}`);
        }
    }

        /** ----------  SINCRONIZAÇÃO pela rota GET /consents/:id ---------- */

    /**
     * Sincroniza um consentimento local buscado pelo id na API externa (/consents/:id)
     * @param {String} idConsent - ID do consentimento a ser buscado.
     * @returns {'active' | 'revoked' | null}
     */
    async syncOneConsentFromApi(idConsent) {
        try {
            const data = await this.fetchWithTimeout(`/consents/${idConsent}`, { method: "GET" });
            await this.saveConsent(data, 'active');
            return 'active';
        } catch (error) {
            if (error.message.includes("404") || error.message.includes("403")) {
                const existingConsent = await this.findById(idConsent);
                if (existingConsent) await this.saveConsent(existingConsent, 'revoked');
                return 'revoked';
            }
            console.error(`Erro ao buscar consentimento ${idConsent}:`, error.message);
            return null;
        }
    }

    /** ----------  BANCO DE DADOS ---------- */

    /**
     * Salva ou atualiza um consentimento no banco
     * @param {Object} consent - Objeto do consentimento a ser salvo ou atualizado.
     * @param {String} [status=null] - Status opcional (ex: 'active' ou 'revoked').
     * @returns {Boolean} Indica se a operação foi bem-sucedida.
     */
    async saveConsent(consent, status = null) {
        try {
            await Consent.findOneAndUpdate(
                { _id: consent._id },
                {
                    clientAppId: consent.clientAppId,
                    customerId: consent.customerId,
                    permissions: consent.permissions,
                    status: status || consent.status,
                    createdAt: consent.createdAt,
                    expiresAt: consent.expiresAt,
                    lastSync: new Date(),
                },
                { upsert: true, new: true }
            );
            return true;
        } catch (error) {
            console.error('Erro ao salvar consentimento:', error.message);
            return false;
        }
    }

    /**
     * Busca um consent pelo ID
     * @param {String} idConsent - ID do consentimento a ser buscado.
     * @returns {Object|null} Retorna o objeto do consentimento, ou null se não for encontrado.
     */
    async findById(idConsent) {
        try {
            return await Consent.findById(idConsent);
        } catch (error) {
            console.error('Erro ao buscar consentimento:', error.message);
            return null;
        }
    }

    /**
     * Busca um consent pelo ID do cliente
     * @param {String} idCustomer - ID do cliente.
     * @returns {Object|null} Retorna o objeto do consentimento, ou null se não for encontrado.
     */
    async findByIdCustomer(idCustomer) {
        try {
            return await Consent.findOne({customerId: idCustomer})
        } catch (error) {
            console.error('Erro ao buscar consentimento:', error.message);
            return null;
        }
    }

    /**
     * Retorna o status do consentimento
     * @param {String} idConsent - ID do consentimento a ser buscado.
     * @returns {String|null} Retorna o status do consentimento, ou null se não encontrado.
     */
    async getStatus(idConsent) {
        try {
            const consent = await this.findById(idConsent);
            return consent?.status || null;
        } catch (error) {
            console.error('Erro ao buscar status:', error.message);
            return null;
        }
    }

    /**
     * Retorna os consentimentos locais que não estão presentes na rota /consents (ou seja, foram revogados)
     * @param {Array} consentArray - Array de consentimentos vindos da API
     * @returns {Promise<Array>} - Array de consentimentos revogados
     */
    async getRevokedConsents(consentArray) {
        const allLocalConsents = await Consent.find({}, "_id status");
        const apiIds = consentArray.map(c => c._id.toString());
        return allLocalConsents.filter(local => !apiIds.includes(local._id.toString()));
    }

    /**
     * Retorna todos os consentimentos ATIVOS de um cliente
     * @param {String} customerId - ID do cliente
     * @returns {Promise<Array>} Lista de consentimentos ativos
     */
    async getActiveConsentsByCustomerId(customerId) {
        try {
            return await Consent.find({ customerId, status: 'active' })
                .select('_id clientAppId permissions status createdAt expiresAt');
        } catch (error) {
            console.error('Erro ao buscar consents ativos por cliente:', error.message);
            return [];
        }
    }


}

export default new ConsentService();
