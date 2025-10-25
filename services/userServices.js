// services/userServices.js
import User from "../models/UserModel.js";

class UserService {
  async Create(nome, cpf, email, senha) {
    try {
      const newUser = new User({ nome, cpf, email, senha });
      await newUser.save();
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao criar usuário.");
    }
  }

  async getOne(email) {
    try {
      const user = await User.findOne({ email }).select("+senha");
      return user;
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao buscar usuário.");
    }
  }
}

export default new UserService();
