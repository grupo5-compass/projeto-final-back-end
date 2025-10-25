// models/UserModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'O nome é obrigatório'],
  },
  cpf: {
    type: String,
    required: [true, 'O CPF é obrigatório'],
    unique: true,
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
    select: false,
  },
}, { timestamps: true });

// Criptografa a senha antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();

  const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!regexSenha.test(this.senha)) {
    return next(new Error('A senha não atende aos critérios de complexidade.'));
  }

  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Verifica senha
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.senha);
};

// Gera token JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const User = mongoose.model('User', UserSchema);
export default User;
