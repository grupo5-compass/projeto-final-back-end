const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'O nome é obrigatório'],
  },
  cpf: {
    type: String,
    required: [true, 'O CPF é obrigatório'],
    unique: true,
    // Validação de formato (simples) pode ser adicionada aqui
    // Ex: match: [/^\d{11}$/, 'Por favor, insira um CPF válido (apenas números)']
    // A validação de CPF (algoritmo) geralmente fica na camada de serviço/controller.
  },
  email: {
    type: String,
    required: [true, 'O e-mail é obrigatório'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, insira um e-mail válido',
    ],
  },
  senha: {
    type: String,
    required: [true, 'A senha é obrigatória'],
    minlength: 8,
    select: false, // Não retorna a senha em consultas por padrão
  },
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
});

// Middleware (Hook) PRE-SAVE para fazer o HASH da senha (RF01 e RNF01)
UserSchema.pre('save', async function (next) {
  // Executa somente se a senha foi modificada (ou é nova)
  if (!this.isModified('senha')) {
    return next();
  }

  // Validação de complexidade da senha (RF01)
  const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!regexSenha.test(this.senha)) {
     return next(new Error('A senha não atende aos critérios de complexidade (mínimo 8 caracteres, uma maiúscula, uma minúscula, um número e um caractere especial).'));
  }

  // Gera o "salt" e faz o hash
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Método para comparar a senha (usado no Login)
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.senha);
};

// Método para gerar o Token JWT (usado no Login)
UserSchema.methods.getSignedJwtToken = function () {
// Note que process.env.JWT_SECRET e JWT_EXPIRE vêm do seu .env    
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};


module.exports = mongoose.model('User', UserSchema);
export default User;