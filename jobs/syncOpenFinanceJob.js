import cron from 'node-cron';
import Consent from '../models/ConsentModel.js';
import consentService from '../services/consentServices.js';
import customerService from '../services/customerServices.js';
import accountService from '../services/accountServices.js';
import transactionService from '../services/transactionServices.js';
import institutionService from '../services/institutionServices.js';

let isRunning = false;

export async function runSync() {
  if (isRunning) {
    console.log('[OpenFinance Sync] Execução já em andamento, pulando este ciclo.');
    return { skipped: true };
  }
  isRunning = true;
  const startedAt = new Date();
  console.log(`[OpenFinance Sync] Início: ${startedAt.toISOString()}`);

  const results = { institutions: {}, consents: {}, customers: 0, accounts: 0, balances: 0, transactions: 0, errors: [] };

  try {
    // 1) Sincronização de Instituições Financeiras (integrada neste job)
    try {
      const instSync = await institutionService.syncInstitution();
      results.institutions = instSync;
    } catch (instErr) {
      console.error('[OpenFinance Sync] Erro ao sincronizar instituições:', instErr.message);
      results.errors.push({ step: 'institutions', error: instErr.message });
    }

    // 2) Sincronização de Consentimentos
    const consentSync = await consentService.syncConsent();
    results.consents = consentSync;

    //Adiciona userId ao consentimento se não existir
    const activeConsents = await Consent.find({
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).select('_id customerId permissions userId');

    for (const consent of activeConsents) {
      try {
        // Verifica se o consentimento nao possui userId
        if (!consent.userId) {
          console.warn(`[OpenFinance Sync] Consentimento sem userId, ignorando: ${consent._id}`);
          continue;
        }
        // Passa o userID para o serviço de cliente
        await customerService.syncCustomerById(consent.customerId, consent.userId);
        results.customers++;

        //Verificaão de permissões mais detalhada (case insensitive)
        //Garante que "ACCOUNTS_READ" ou "accounts" sejam detectados corretamente
        const perms = consent.permissions.map(p => p.toLowerCase());
        const hasAccounts = perms.some(p => p.includes("ACCOUNTS"));
        const hasTransactions = perms.some(p => p.includes("TRANSACTIONS") || p.includes("CREDIT_CARDS"));

        let accountIds = [];
        if (hasAccounts) {
          accountIds = await accountService.syncAccountsForCustomer(consent.customerId);
          results.accounts += accountIds.length;

          for (const accountId of accountIds) {
            try {
              await accountService.syncBalance(accountId);
              results.balances++;
            } catch (balErr) {
              console.error('[OpenFinance Sync] Erro ao sincronizar saldo da conta:', accountId, balErr.message);
              results.errors.push({ step: 'balances', accountId, error: balErr.message });
            }
          }
        }

        if (hasTransactions) {
          const targets = hasAccounts ? accountIds : [];
          // Se não sincronizou contas nesta rodada, ainda é possível que já existam associadas ao cliente
          if (!hasAccounts) {
            const customer = await customerService.getLocalCustomer(consent.customerId);
            if (customer) accountIds = customer.accounts || [];
          }

          for (const accountId of (targets.length ? targets : accountIds)) {
            const txIds = await transactionService.syncTransactionsForAccount(accountId);
            results.transactions += txIds.length;
          }
        }
      } catch (err) {
        results.errors.push({ consentId: consent._id.toString(), error: err.message });
      }
    }
  } catch (error) {
    console.error('[OpenFinance Sync] Falha geral:', error.message);
    results.errors.push({ error: error.message });
  }

  const finishedAt = new Date();
  console.log(`[OpenFinance Sync] Fim: ${finishedAt.toISOString()}`);
  console.log('[OpenFinance Sync] Resultado:', JSON.stringify(results));
  isRunning = false;
  return results;
}

export function startJob() {
  const enabled = process.env.ENABLE_SYNC_JOB === 'true';
  const cronExp = process.env.OPENFINANCE_SYNC_CRON || process.env.SYNC_CRON || '0 * * * *';

  if (!enabled) {
    console.log('[OpenFinance Sync] Job desativado por configuração.');
    return null;
  }

  console.log(`[OpenFinance Sync] Agendando com expressão: ${cronExp}`);
  const task = cron.schedule(cronExp, runSync, { scheduled: true });
  return task;
}

export default { startJob };
