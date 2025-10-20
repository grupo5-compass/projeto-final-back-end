//Importação do express
import express from "express";
const app = express();


// configuração do Express
app.use(express.urlencoded({ extended: false}));
app.use(express.json());


// Rota base para teste
app.get("/", (req, res) => {
    res.send("API funcionando rodando normalmente!");
});

// Configuração da porta da API
const port = 4000;
app.listen(port, (error) => {
    if(error){
        console.log(error);
    }
    console.log(`API rodando em  http://localhost:${port}`);
})