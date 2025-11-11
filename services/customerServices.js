import Customer from '../models/CustomerModel.js';
import { fetchWithTimeout } from './openFinanceApi.js';

class CustomerService {
  async syncCustomerById(customerId) {
    try {
      const data = await fetchWithTimeout(`/customers/${customerId}`, { method: 'GET' });
      const updated = await Customer.findOneAndUpdate(
        { _id: data._id },
        {
          name: data.name,
          cpf: data.cpf,
          lastSync: new Date(),
        },
        { upsert: true, new: true }
      );
      return updated;
    } catch (error) {
      console.error(`Erro ao sincronizar cliente ${customerId}:`, error.message);
      throw error;
    }
  }

  async getLocalCustomer(customerId) {
    return Customer.findById(customerId);
  }

  async getCustomerByCpf(cpf) {
    return Customer.findOne({ cpf });
  }
}

export default new CustomerService();