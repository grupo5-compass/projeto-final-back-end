import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        date: { type: Date, required: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, enum: ["credit", "debit"], required: true },
        category: { type: String, required: true },
        currentInstallment: { type: Number, required: true },
        totalInstallments: { type: Number, required: true },
        accountId: { type: String, required: true },
        lastSync: { type: Date, default: Date.now },
    },
    { collection: "transactions" }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;
