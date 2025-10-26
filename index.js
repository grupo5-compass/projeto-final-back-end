//Importação do express
import express from "express";
//const app = express();
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js'; // <-- 1. Importar a conexão com o DB

// --- Configuração Inicial ---
// Carrega as variáveis de ambiente do .env
dotenv.config();

// Conecta ao Banco de Dados MongoDB
connectDB(); // <-- 2. Executar a conexão

const app = express();

// Configuração do CORS
const corsOptions = {
    origin: true, // Permite qualquer origem
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true // Permite cookies e credenciais
};

app.use(cors(corsOptions));

// configuração do Express
app.use(express.urlencoded({ extended: false}));
app.use(express.json());


// Rota base para teste
app.get("/", (req, res) => {
    res.send("API funcionando rodando normalmente!");
});

// (Aqui você irá adicionar suas rotas de autenticação e outras)
// Ex: import authRoutes from './routes/authRoutes.js';
//     app.use('/api/auth', authRoutes);

import User from "./models/UserModel.js";
import userRoutes from './routes/userRoutes.js';
app.use("/", userRoutes);

// --- Inicialização do Servidor ---
// Configuração da porta da API (usando a variável de ambiente ou 4000)
const port = process.env.PORT || 4000;

// Configuração da porta da API
//const port = 4000;
app.listen(port, (error) => {
    if(error){
        console.log(error);
    }
    console.log(`API rodando em  http://localhost:${port}`);
})