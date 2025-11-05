// testsConsent/jstestSyncConsent.js
import connectDB from '../config/db.js';

import mongoose from "mongoose";
import ConsentService from "../services/consentServices.js";

async function testSyncConsent() {
    await connectDB();

    try {
        const result = await ConsentService.syncConsent();
        console.log("Resultado da sincronização:", result);

        // Exibe todos os consentimentos do banco (opcional)
        const allConsents = await (await import("../models/ConsentModel.js")).default.find();
        console.log("Todos os consentimentos no banco:", allConsents);
    } catch (error) {
        console.error("Erro ao sincronizar consentimentos:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Desconectado do MongoDB!");
    }
}

testSyncConsent();