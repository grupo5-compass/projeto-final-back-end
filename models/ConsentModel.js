// models/Consent.js
import mongoose from 'mongoose';

const ConsentSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, 'O ID é obrigatório'],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Referência ao Model de Usuário
            required: [true, 'O consentimento deve estar vinculado a um usuário do sistema'],
        },
        institutionId: {
            type: String, // Ex: "if_001"
            required: [true, 'O ID da instituição financeira é obrigatório'],
        },
        customerId: {
            type: String,
            required: [true, 'O ID do cliente é obrigatório'],
        },
        clientAppId: {
            type: String,
            required: [true, 'O clientAppId é obrigatório'],
        },
        permissions: {
            type: [String],
            required: [true, 'As permissões são obrigatórias'],
        },
        status: {
            type: String,
            enum: ['active', 'revoked'],
            required: [true, 'O status é obrigatório'],
        },
        createdAt: { // Recebe data de criação do consentimento na API
            type: Date,
            required: [true, 'A data de criação do consent é obrigatória'],
        },
        expiresAt: {
            type: Date,
            required: [true, 'A data de expiração do consent é obrigatória'],
        },
        lastSync: {
            type: Date,
            default: Date.now  // Atualiza a data de sincronização do consentimento
        }
    }, 
    {
        collection: 'consents',
        timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    }
);

const Consent = mongoose.model('Consent', ConsentSchema);
export default Consent;