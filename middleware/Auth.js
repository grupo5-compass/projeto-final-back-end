import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// função de autenticação com JWT
const Authorization = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    // 1. Verifica se o header existe
    if (!authHeader) {
        return res.status(401).json({ err: "Acesso negado: Token não fornecido" });
    }

    //Valida o formato bearer <token>
    const parts = authHeader.split(" ");

    //Se não tiver 2 partes, retorna erro

    if (parts.length !== 2) {
        res.status(401).json({ err: "Token mal formatado" });
    }

    const [scheme, authToken] = parts;

    // Opcional: Verifica se a primeira parte é 'Bearer'
    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ err: "Token malformado." });
    }

    // 3. Verifica a validade do token
    jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
        if(err){
            // Diferencia erro de expiração para o frontend saber se deve renovar
            const message = err.name === 'TokenExpiredError' ? "Token expirado" : "Token inválido";
            return res.status(401).json({ err: message });
        }
        // Sucesso: Injeta dados no request
            
        req.token = token;
        req.LoggedUser = {
                id: decode.id,
                email: decode.email,
                cpf: decode.cpf,
        };
        next();
    });
};

export default { Authorization };