import transactionService from "./transactionServices.js";
import accountService from "./accountServices.js";

class DashboardService {
    async getDashboardData(cpf) {
        const billThisMonth = await this.getBillThisMonth(cpf);
        const billLastMonth = await this.getBillLastMonth(cpf);
        const creditCardLimit = await accountService.getAllCreditCardLimit(cpf);

        const growth = billLastMonth === 0
            ? null
            : ((billThisMonth - billLastMonth) / billLastMonth) * 100;

        const availableLimit = creditCardLimit - billThisMonth;

        return {
            billThisMonth,
            billLastMonth,
            creditCardLimit,
            growth,
            availableLimit
        };
    }

    async getBills(cpf, startDate, endDate) {
            const transactions = await transactionService.getTransactionsByCustomerCpfAndDateRange(
                cpf,
                startDate,
                endDate
            );

            return transactions.reduce((sum, tx) => sum + tx.amount, 0);
        }

    async getBillThisMonth(cpf) {
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return this.getBills(cpf, firstDayThisMonth, lastDayThisMonth);
    }

    async getBillLastMonth(cpf) {
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        return this.getBills(cpf, firstDayLastMonth, lastDayLastMonth);
    }


}

export default new DashboardService();