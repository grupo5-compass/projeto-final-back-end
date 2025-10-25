import userServices from "../services/userServices.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const secretKey = process.env.JWT_SECRET

// Cadastrando um novo usuário
const createUser = async (req, res) => {
    try{
        const { nome, cpf, email, senha } = req.body;
        await userServices.Create(nome, cpf, email, senha);
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
};

// Login de usuário + token de autenticação
// Login do usuário + token de autenticação
const LoginUser = async (req, res) => {
    try{
        const {email, password} = req.body;
        // email valido
        if(email != undefined){
            const user = await userServices.getOne(email);
            // usuario encontrado
            if(user != undefined){
                // senha incorreta
                if(user.password == password){
                    // cria o token e determina e seu tempo de validade
                    jwt.sign(
                        {id: user._id, email: user.email},
                        JWTSecret,
                        {expiresIn: "48h"},
                        (err, token) => {
                            if(err) {
                                res.status(400);
                                res.json({err: "Falha interna"});
                            } else {
                                res.status(200);
                                res.json({token: token})
                            }
                        }
                    );
                    // senha incorreta
                } else {
                    res.status(401);
                    res.json({err: "Credenciais Inválidas!"})
                }
                // Usuário não encontrado
            } else {
                res.status(404);
                res.json({err: "o email enviado não foi encontrado!"})
            }
            // email inválido
        } else {
            res.status(400);
            res.json({err: "o email enviado é inválido!"});
        }
    } catch (error ){
        console.log(error);
        res.sendStatus(500);
    }
};