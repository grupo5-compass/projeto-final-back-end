import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        date: { type: Date, required: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, enum: ["credit", "debit"], required: true },
        category: { type: String, required: true },

        // CORREÇÃO: Parcelas devem ser opcionais
        // Transações à vista ou de conta corrente não possuem esses dados
        currentInstallment: { type: Number },
        totalInstallments: { type: Number,},

        accountId: { 
            type: String, 
            ref: 'Account', // Boa prática: Referência ao modelo de conta
            required: true 
        },
        
        lastSync: { type: Date, default: Date.now },
    },
    { collection: "transactions" }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;
