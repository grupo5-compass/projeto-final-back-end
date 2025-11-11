import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        name: { type: String, required: true },
        cpf: { type: String, required: true },
        accounts: { type: [String], default: [] },
        lastSync: { type: Date, default: Date.now },
    },
    { collection: "customers" }
);

const Customer = mongoose.model("Customer", CustomerSchema);
export default Customer;
