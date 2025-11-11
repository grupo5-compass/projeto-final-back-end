import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        type: {
            type: String,
            enum: ["checking", "credit-card"],
            required: true,
        },
        branch: { type: String, required: true },
        number: { type: String, required: true },
        balance: { type: Number, default: 0 },
        creditCardLimit: { type: Number, default: undefined },
        transactions: { type: [String], default: [] },
        lastSync: { type: Date, default: Date.now },
    },
    { collection: "accounts" }
);

const Account = mongoose.model("Account", AccountSchema);
export default Account;
