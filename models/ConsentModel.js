// models/Consent.js
import mongoose from 'mongoose';

// clientAppId -> é necessário nesse sistema??
// permissions -> é necessário nesse sistema??

const ConsentSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, 'O ID é obrigatório'],
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
    }
);

const Consent = mongoose.model('Consent', ConsentSchema);
export default Consent;