import transactionService from "../services/transactionServices.js";

export const getMyTransactions = async (req, res) => {
  try {
    const cpf = req?.LoggedUser?.cpf;
    if (!cpf) {
      return res.status(403).json({ success: false, error: "Acesso negado: CPF não presente no token." });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await transactionService.getTransactionsByCustomerCpf(cpf, { page, limit });
    // Quando não há transações, retornar 200 com lista vazia e metadados
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("[GET /transactions/me] Erro:", error.message);
    return res.status(500).json({ success: false, error: "Erro ao consultar transações.", details: error.message });
  }
};