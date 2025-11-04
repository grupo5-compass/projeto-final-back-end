// testSyncConsent.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import ConsentService from "./services/consentServices.js";

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Conectado ao MongoDB!");
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        process.exit(1);
    }
}

async function testSyncConsent() {
    await connectDB();

    try {
        const result = await ConsentService.syncConsent();
        console.log("Resultado da sincronização:", result);

        // Exibe todos os consentimentos do banco (opcional)
        const allConsents = await (await import("./models/ConsentModel.js")).default.find();
        console.log("Todos os consentimentos no banco:", allConsents);
    } catch (error) {
        console.error("Erro ao sincronizar consentimentos:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Desconectado do MongoDB!");
    }
}

testSyncConsent();