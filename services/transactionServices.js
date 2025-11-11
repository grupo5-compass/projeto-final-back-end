import Transaction from "../models/TransactionModel.js";
import Account from "../models/AccountModel.js";
import { fetchWithTimeout } from "./openFinanceApi.js";

class TransactionService {
    async syncTransactionsForAccount(accountId) {
        try {
            const transactions = await fetchWithTimeout(
                `/accounts/${accountId}/transactions`,
                { method: "GET" }
            );

            const persistedIds = [];
            for (const tx of transactions) {
                const updated = await Transaction.findOneAndUpdate(
                    { _id: tx._id },
                    {
                        date: tx.date,
                        description: tx.description,
                        amount: tx.amount,
                        type: tx.type,
                        category: tx.category,
                        currentInstallment: tx.currentInstallment,
                        totalInstallments: tx.totalInstallments,
                        accountId: accountId,
                        lastSync: new Date(),
                    },
                    { upsert: true, new: true }
                );
                persistedIds.push(updated._id);
            }

            await Account.findOneAndUpdate(
                { _id: accountId },
                { transactions: persistedIds, lastSync: new Date() },
                { new: true }
            );

            return persistedIds;
        } catch (error) {
            console.error(
                `Erro ao sincronizar transações da conta ${accountId}:`,
                error.message
            );
            throw error;
        }
    }
}

export default new TransactionService();
