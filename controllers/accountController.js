import accountService from "../services/accountServices.js";

export const getMyAccounts = async (req, res) => {
  try {
    const cpf = req?.LoggedUser?.cpf;
    if (!cpf) {
      return res.status(403).json({ success: false, error: "Acesso negado: CPF não presente no token." });
    }

    const accounts = await accountService.getAccountsByCustomerCpf(cpf);
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ success: false, error: "Nenhuma conta encontrada para o CPF do token." });
    }

    return res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    console.error("[GET /accounts/me] Erro:", error.message);
    return res.status(500).json({ success: false, error: "Erro ao consultar contas.", details: error.message });
  }
};