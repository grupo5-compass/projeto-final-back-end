import Transaction from "../models/TransactionModel.js";
import Account from "../models/AccountModel.js";
import Customer from "../models/CustomerModel.js";
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

    async getTransactionsByCustomerCpf(cpf, { page = 1, limit = 20 } = {}) {
        const customer = await Customer.findOne({ cpf }).lean();
        if (!customer) {
            return { items: [], page, limit, total: 0, totalPages: 0 };
        }
        const accountIds = Array.isArray(customer.accounts) ? customer.accounts : [];
        if (accountIds.length === 0) {
            return { items: [], page, limit, total: 0, totalPages: 0 };
        }

        const query = { accountId: { $in: accountIds } };
        const total = await Transaction.countDocuments(query);
        const totalPages = Math.ceil(total / limit) || 1;
        const skip = (Math.max(1, page) - 1) * limit;
        const items = await Transaction.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return { items, page, limit, total, totalPages };
    }

    async getTransactionsByCustomerCpfAndDateRange(cpf, startDate, endDate) {
        const customer = await Customer.findOne({ cpf }).lean();
        if (!customer) return [];

        const accountIds = Array.isArray(customer.accounts) ? customer.accounts : [];
        if (accountIds.length === 0) return [];

        return Transaction.find({
            accountId: { $in: accountIds },
            date: { $gte: startDate, $lte: endDate }
        }).lean();
    }
}

export default new TransactionService();
