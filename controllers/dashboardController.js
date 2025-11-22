import dashboardService from "../services/dashboardServices.js";

export const getDashboardData = async (req, res) => {
    try {
        const cpf = req?.LoggedUser?.cpf;

        if (!cpf) {
            return res.status(403).json({ success: false, error: "CPF não presente no token." });
        }

        const data = await dashboardService.getDashboardData(cpf);

        return res.status(200).json({ success: true, ...data });

    } catch (error) {
        console.error("Erro no dashboard: ", error);
        return res.status(500).json({ success: false, error: "Erro ao gerar dashboard." });
    }
};