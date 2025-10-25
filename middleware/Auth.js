import jwt from "jsonwebtoken";
import userController from "../controllers/userController.js";

// função de autenticação com JWT
const Authorization = (req, res, next) => {
    const authToken = req.headers["authorization"];
    if(authToken != undefined) {
        const bearer = authToken.split(" ");
        var token = bearer[1];
        jwt.verify(token, userController.JWTSecret, (err, data) => {
            if(err){
                res.status(401);
                res.json({err: "Token Inválido!"});
            } else {
                req.token = token;
                req.LoggedUser = {
                    id: data.id,
                    email: data.email,
                };
                next();
            }
        })
    } else {
        res.status(401);
        res.json({err: "Token Inválido"});
    }
};

export default { Authorization };