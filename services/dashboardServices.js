import transactionService from "./transactionServices";

class DashboardService {
    async getBills(cpf) {
        const { items: transactions } = await transactionService.getTransactionsByCustomerCpf(cpf);

        const now = new Date();

        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const sumTransactions = (start, end) =>
            transactions
                .filter(tx => {
                    const txDate = new Date(tx.date);
                    return txDate >= start && txDate <= end;
                })
                .reduce((sum, tx) => sum + tx.amount, 0);

        const billThisMonth = sumTransactions(firstDayThisMonth, lastDayThisMonth) || 0;
        const billLastMonth = sumTransactions(firstDayLastMonth, lastDayLastMonth) || 0;

        return { billThisMonth, billLastMonth };
    }

    async getMonthlyBillStats(cpf) {
        const { billThisMonth, billLastMonth } = await this.getBills(cpf);

        let growthPercent = null;

        if (billLastMonth > 0) {
            // calcula crescimento percentual
            growthPercent = ((billThisMonth - billLastMonth) * 100) / billLastMonth;
            growthPercent = Number(growthPercent.toFixed(2));
        }

        // Retorna { billThisMonth, billLastMonth, growthPercent }
        // Retorna null no crescimento quando não houve gasto mês passado
        // O front pode mostrar "Sem gasto mês passado" ou outro texto amigável
        return {
            billThisMonth,
            billLastMonth,
            growthPercent
        };
    }

    async getCreditCardLimit(){

    }

    async getNextBill(){

    }
}

export default new DashboardService();