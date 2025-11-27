import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        
        // Vincula ao usuário do app que criou o cliente bancário
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', // Vincula ao usuário que fez login
            required: [true, "O cliente bancário deve estar vinculado a um usuário do app"] 
        },

        name: { type: String, required: true },
        cpf: { type: String, required: true },

        // Melhoria: Definir como referência para permitir .populate('accounts') no futuro
        accounts: [{ 
            type: String, 
            ref: 'Account' 

        }],

        lastSync: { type: Date, default: Date.now },
    },
    { collection: "customers" }
);

const Customer = mongoose.model("Customer", CustomerSchema);
export default Customer;
