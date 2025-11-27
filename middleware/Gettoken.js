const Gettoken = (req) => {
    const authHeader = req.headers.authorization;

    //Se não houver cabeçalho, retorna null imediatamente (evita crash)
    if (!authHeader) {
        return null;
    }

    //Garante que o formato seja "Bearer <token>"
    const parts = authHeader.split(" ");

    //Se tiver menos de 2 partes (ex: enviou só o token sem 'Bearer'), retorna null
    if (parts.length < 2) {
        return null;
    }

// Retorna a segunda parte (o token em si)
    return parts[1];
};

export default Gettoken;
