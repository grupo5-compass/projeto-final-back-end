// jobs/syncInstitutionsJob.js
import cron from "node-cron";
import financialInstitutionService from "../services/financialInstitutionServices.js";

let isRunning = false;

export function startSyncJob() {
    const cronExpr = process.env.SYNC_CRON || "*/30 * * * *"; // a cada 30 min por padrão

    console.log(`[JOB] Registrando sync job com cron: ${cronExpr}`);

    cron.schedule(cronExpr, async () => {
        if (isRunning) {
            console.log("[JOB] Sync já em execução, pulando este ciclo.");
            return;
        }
        isRunning = true;
        const start = Date.now();
        console.log(
            "[JOB] Iniciando sincronização periódica de instituições..."
        );
        try {
            const result = await financialInstitutionService.syncInstitution();
            const duration = Date.now() - start;
            console.log(
                `[JOB] Sincronização concluída. Tempo: ${duration}ms. Criadas: ${result.created}, Atualizadas: ${result.updated}, Erros: ${result.errors.length}`
            );
        } catch (err) {
            console.error(
                "[JOB] Erro na sincronização periódica:",
                err.message
            );
        } finally {
            isRunning = false;
        }
    });
}
