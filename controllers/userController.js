// controllers/userController.js
import userServices from "../services/userServices.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWTSecret = process.env.JWT_SECRET;

// Cadastra novo usuário
export const createUser = async (req, res) => {
  try {
    const { nome, cpf, email, senha } = req.body;
    await userServices.Create(nome, cpf, email, senha);
    res.status(201).json({ message: "Usuário criado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar usuário." });
  }
};

// Login + token JWT
export const loginUser = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ err: "Email e senha são obrigatórios." });
    }

    const user = await userServices.getOne(email);
    if (!user) {
      return res.status(404).json({ err: "Usuário não encontrado." });
    }

    const isMatch = await user.matchPassword(senha);
    if (!isMatch) {
      return res.status(401).json({ err: "Credenciais inválidas." });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWTSecret, {
      expiresIn: process.env.JWT_EXPIRE || "48h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro no login." });
  }
};
