// services/consentServices.js
import dotenv from 'dotenv';
dotenv.config();

import Consent from '../models/ConsentModel.js';

class ConsentService {
    constructor() {
        this.apiUrl = process.env.FINANCIAL_INSTITUTION_API_URL_1;
        this.apiKey = process.env.FINANCIAL_INSTITUTION_API_KEY_1;
        this.timeout = parseInt(process.env.FINANCIAL_INSTITUTION_TIMEOUT_1) || 5000;
    }

    /**
     * Busca consentimentos da API externa pela rota /consents
     * @returns {Promise<Array>} Lista de consentimentos
     */
    async fetchFromExternalAPI() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                this.timeout
            );

            const response = await fetch(`${this.apiUrl}/consents`, {
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

            const consents = await response.json();
            return consents || {};
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error(
                    `Timeout na requisição para API externa (${this.timeout}ms)`
                );
            }
            console.error("Erro ao buscar consentimentos da API externa:", error);
            throw new Error(
                `Erro ao conectar com API externa: ${error.message}`
            );
        }
    }

    /**
     * Sincroniza consentimentos locais com a API externa provindos da rota /consents
     * @returns {Promise<Object>} Resultado da sincronização
     */
    async syncConsent() {
        try {
            const consentData = await this.fetchFromExternalAPI();

            if (!consentData) {
                throw new Error("Nenhum dado retornado da API externa");
            }

            let syncResults = {
                created: 0,
                updated: 0,
                revoked: 0,
                errors: [],
                syncDate: new Date(),
            };

            // Normaliza os dados para sempre trabalhar com array
            const consentArray = Array.isArray(consentData) ? consentData : [consentData];

            // Atualiza ou cria consentimentos
            await Promise.all(consentArray.map(async (consent) => {
                try {
                    const result = await Consent.findOneAndUpdate(
                        { _id: consent._id }, 
                        {
                            clientAppId: consent.clientAppId,
                            customerId: consent.customerId,
                            permissions: consent.permissions,
                            status: 'active',
                            createdAt: consent.createdAt,
                            expiresAt: consent.expiresAt,
                            lastSync: new Date(),
                        },
                        // Se consentimento não existia, adicona um novo no banco
                        { upsert: true, new: true }  
                    );

                    // Verifica se o documento já existia
                    if (result.lastErrorObject.updatedExisting) {  
                        syncResults.updated++;
                    } else {
                        syncResults.created++;
                    }
                } catch (error) {
                    console.error(
                        `Erro ao sincronizar consentimento ${consent._id}:`,
                        error
                    );
                    syncResults.errors.push(consent._id);
                }

            }));

            // Caso 3 — marcar como "revoked" os consentimentos que estão no banco mas não vieram da API
            const allLocalConsents = await Consent.find({}, "_id status");
            const apiIds = consentArray.map((c) => c._id.toString());
            
            const revokedConsents = allLocalConsents.filter(
                (local) => !apiIds.includes(local._id.toString())
            );

            if (revokedConsents.length > 0) {
                await Promise.all(
                    revokedConsents.map(async (consent) => {
                        await Consent.findByIdAndUpdate(consent._id, {
                            status: "revoked",
                            lastSync: new Date(),
                        });
                        syncResults.revoked++;
                    })
                );
            }
            return syncResults;
        } catch (error) {
            console.error("Erro na sincronização:", error);
            throw new Error(
                `Erro ao sincronizar consentimentos: ${error.message}`
            );
        }
    }





    





}
export default new ConsentService();