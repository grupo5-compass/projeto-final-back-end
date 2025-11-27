// controllers/userController.js
import userServices from "../services/userServices.js";
import GetToken from "../middleware/Gettoken.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWTSecret = process.env.JWT_SECRET;

// Cadastra novo usuário
export const createUser = async (req, res) => {
    try {
        const { nome, cpf, email, senha } = req.body;

        // Validação básica
        if (!nome || !cpf || !email || !senha) {
            return res
                .status(400)
                .json({ err: "Todos os campos são obrigatórios." });
        }
        await userServices.Create(nome, cpf, email, senha);
        res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (error) {
        console.error(error);

        //Tratamento específico para duplicidade (Error code 11000 do MongoDB)
        if (error.code === 11000) {
            return res
                .status(409)
                .json({ err: "Email ou CPF já cadastrado." 

            });
        }
        res.status(500).json({ message: "Erro ao criar usuário." });
    }
};

// Login + token JWT
export const loginUser = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res
                .status(400)
                .json({ err: "Email e senha são obrigatórios." });
        }

        const user = await userServices.getOne(email);

        //Segurança: evitar enumeração de usuários
        //Para MVP manter a lógica, status 401
        if (!user) {
            return res.status(401).json({ err: "Credenciais inválidas." });
        }

        const isMatch = await user.matchPassword(senha);
        if (!isMatch) {
            return res.status(401).json({ err: "Credenciais inválidas." });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, cpf: user.cpf },
             JWTSecret,
            { expiresIn: process.env.JWT_EXPIRE || "48h" }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro no login." });
    }
};

// Checar e pegar dados do usuário logado
export const checkUser = async (req, res) => {

    try {

        let currentUser = null;

        // Verifica se o cabeçalho existe antes de tentar processar
        if (req.headers.authorization) {
            const token = GetToken(req);

            if (token) {
                // CORREÇÃO: jwt.verify DEVE estar dentro do try/catch
                // Se o token for inválido, ele lança erro e cai no catch abaixo
                // evitando crash do servidor.
                const decoded = jwt.verify(token, JWTSecret);

                currentUser = await userServices.getOne(decoded.email);
                
                // Remove a senha do objeto de retorno por segurança
                if (currentUser) {
                    currentUser.password = undefined; 
                }
            }
        }

         res.status(200).json(currentUser);
    } catch (error) {
        // Se o token for inválido, expirado ou houver erro no banco
        // apenas retornamos null (usuário não logado), sem derrubar a API.
        // Opcionalmente pode logar o erro: console.log("CheckUser falhou:", error.message);
        res.status(200).json(null);
    }
};
