import express from 'express';
const userRoutes = express.Router();
import userController from '../controllers/userController.js';

// Endpoint para cadastro de um usuário novo
userRoutes.post('/user', userController.createUser);
// Endpoint para login de usuário
userRoutes.post('/auth', userController.loginUser);

export default userRoutes;

