import customerService from "../services/customerServices.js";

export const getMyCustomer = async (req, res) => {
  try {
    const cpf = req?.LoggedUser?.cpf;
    if (!cpf) {
      return res.status(403).json({ success: false, error: "Acesso negado: CPF não presente no token." });
    }

    const customer = await customerService.getCustomerByCpf(cpf);
    if (!customer) {
      return res.status(404).json({ success: false, error: "Cliente não encontrado para o CPF do token." });
    }

    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("[GET /customers/me] Erro:", error.message);
    return res.status(500).json({ success: false, error: "Erro ao consultar cliente.", details: error.message });
  }
};