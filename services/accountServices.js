import Account from '../models/AccountModel.js';
import Customer from '../models/CustomerModel.js';
import { fetchWithTimeout } from './openFinanceApi.js';

class AccountService {
  async syncAccountsForCustomer(customerId) {
    try {
      const accounts = await fetchWithTimeout(`/customers/${customerId}/accounts`, { method: 'GET' });

      // Sincronizar somente contas do tipo "credit-card"
      const creditCardAccounts = Array.isArray(accounts)
        ? accounts.filter(acc => acc && acc.type === 'credit-card')
        : [];

      const persistedIds = [];
      for (const acc of creditCardAccounts) {
        const updated = await Account.findOneAndUpdate(
          { _id: acc._id },
          {
            type: acc.type,
            branch: acc.branch,
            number: acc.number,
            lastSync: new Date(),
          },
          { upsert: true, new: true }
        );
        persistedIds.push(updated._id);
      }

      await Customer.findOneAndUpdate(
        { _id: customerId },
        { accounts: persistedIds, lastSync: new Date() },
        { new: true }
      );

      return persistedIds;
    } catch (error) {
      console.error(`Erro ao sincronizar contas do cliente ${customerId}:`, error.message);
      throw error;
    }
  }

  async syncBalance(accountId) {
    try {
      const balance = await fetchWithTimeout(`/accounts/${accountId}/balance`, { method: 'GET' });
      await Account.findOneAndUpdate(
        { _id: accountId },
        {
          balance: balance.balance,
          creditCardLimit: balance.creditCardLimit,
          lastSync: new Date(),
        },
        { new: true }
      );
      return balance;
    } catch (error) {
      console.error(`Erro ao sincronizar saldo da conta ${accountId}:`, error.message);
      throw error;
    }
  }

  async getAccountsByCustomerCpf(cpf) {
    const customer = await Customer.findOne({ cpf }).lean();
    if (!customer) return [];
    if (!customer.accounts || customer.accounts.length === 0) return [];
    return Account.find({ _id: { $in: customer.accounts } }).lean();
  }
}

export default new AccountService();