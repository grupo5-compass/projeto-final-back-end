// models/FinancialInstitutionModel.js
import mongoose from "mongoose";

const FinancialInstitutionSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: [true, "O ID da instituição é obrigatório"],
            unique: true,
            trim: true,
            match: [
                /^if_\d{3}$/,
                "O ID deve seguir o padrão if_XXX (ex: if_001)",
            ],
        },
        nome: {
            type: String,
            required: [true, "O nome da instituição é obrigatório"],
            trim: true,
            match: [
                /^bnk_\d{3}$/,
                "O nome deve seguir o padrão bnk_XXX (ex: bnk_001)",
            ],
        },
        status: {
            type: Boolean,
            required: [true, "O status da instituição é obrigatório"],
            default: false,
        },
        lastSync: {
            type: Date,
            default: null,
            validate: {
                validator: function (value) {
                    // Se lastSync for fornecido, deve ser uma data válida e não pode ser no futuro
                    if (value && value > new Date()) {
                        return false;
                    }
                    return true;
                },
                message:
                    "A data de última sincronização não pode ser no futuro",
            },
        },
    },
    {
        timestamps: true, // Adiciona automaticamente createdAt e updatedAt
        collection: "financial_institutions",
    }
);

// Índices para otimização de consultas
// Nota: O campo 'id' já possui índice único através de 'unique: true' na definição do schema
FinancialInstitutionSchema.index({ nome: 1 });
FinancialInstitutionSchema.index({ status: 1 });
FinancialInstitutionSchema.index({ lastSync: 1 });
FinancialInstitutionSchema.index({ createdAt: 1 });

// Middleware para validação antes de salvar
FinancialInstitutionSchema.pre("save", function (next) {
    // Garantir que o status seja sempre um boolean
    if (typeof this.status !== "boolean") {
        this.status = Boolean(this.status);
    }
    next();
});

// Método para validação de status (ativo/inativo)
FinancialInstitutionSchema.methods.isActive = function () {
    return this.status === true;
};

FinancialInstitutionSchema.methods.isInactive = function () {
    return this.status === false;
};

FinancialInstitutionSchema.methods.validateStatus = function () {
    return {
        isValid: typeof this.status === "boolean",
        status: this.status,
        statusText: this.status ? "Ativo" : "Inativo",
    };
};

// Método para atualização de última sincronização
FinancialInstitutionSchema.methods.updateLastSync = function (syncDate = null) {
    const now = new Date();
    this.lastSync = syncDate || now;

    // Validar se a data não é no futuro
    if (this.lastSync > now) {
        throw new Error("A data de sincronização não pode ser no futuro");
    }

    return this.save();
};

// Método para obter informações de sincronização
FinancialInstitutionSchema.methods.getSyncInfo = function () {
    const now = new Date();
    const lastSync = this.lastSync;

    if (!lastSync) {
        return {
            hasBeenSynced: false,
            lastSyncDate: null,
            timeSinceLastSync: null,
            syncStatus: "Nunca sincronizado",
        };
    }

    const timeDiff = now - lastSync;
    const hoursSinceSync = Math.floor(timeDiff / (1000 * 60 * 60));
    const daysSinceSync = Math.floor(hoursSinceSync / 24);

    return {
        hasBeenSynced: true,
        lastSyncDate: lastSync,
        timeSinceLastSync: {
            milliseconds: timeDiff,
            hours: hoursSinceSync,
            days: daysSinceSync,
        },
        syncStatus:
            daysSinceSync === 0
                ? "Sincronizado hoje"
                : daysSinceSync === 1
                ? "Sincronizado ontem"
                : `Sincronizado há ${daysSinceSync} dias`,
    };
};

// Método estático para buscar instituições ativas
FinancialInstitutionSchema.statics.findActive = function () {
    return this.find({ status: true });
};

// Método estático para buscar instituições inativas
FinancialInstitutionSchema.statics.findInactive = function () {
    return this.find({ status: false });
};

// Método estático para buscar por ID da instituição
FinancialInstitutionSchema.statics.findByInstitutionId = function (
    institutionId
) {
    return this.findOne({ id: institutionId });
};

// Método estático para atualizar status em lote
FinancialInstitutionSchema.statics.updateStatusBatch = function (
    institutionIds,
    newStatus
) {
    return this.updateMany(
        { id: { $in: institutionIds } },
        { $set: { status: newStatus, updatedAt: new Date() } }
    );
};

const FinancialInstitution = mongoose.model(
    "FinancialInstitution",
    FinancialInstitutionSchema
);
export default FinancialInstitution;
