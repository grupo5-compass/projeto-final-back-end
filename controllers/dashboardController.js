import dashboardService from "../services/dashboardServices";

export const getBillStats = async (req, res) => {
    try {
        const cpf = req?.LoggedUser?.cpf;
        if (!cpf) {
            return res.status(403).json({ success: false, error: "Acesso negado: CPF não presente no token." });
        }

        const stats = await dashboardService.getMonthlyBillStats(cpf);
        return res.status(200).json({ success: true, ...stats });

    } catch (error) {
        console.error("Erro ao consultar faturas:", error);
        return res.status(500).json({ success: false, error: "Erro ao buscar valores das faturas.", details: error.message });
    }
};