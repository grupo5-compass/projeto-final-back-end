import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carrega as variáveis do .env (necessário se for usar process.env aqui)
dotenv.config(); 

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1); // Encerra o processo com falha
  }
};

// Exportação padrão de Módulo ES
export default connectDB;