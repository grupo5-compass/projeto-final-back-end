import express from "express";

// 1. Importa os controllers que executam a ação
import {
    listInstitutions,
    syncInstitutions,
    getMyInstitutions,
} from "../controllers/institutionController.js";

// 2. Importa o middleware de autenticação (Auth.js)
// Importado o objeto 'Auth' que contém a função 'Authorization'
import Auth from "../middleware/Auth.js";

const router = express.Router();

// --- Definição das Rotas de Instituições ---

/**
 * @route   GET /api/institutions
 * @desc    Lista as instituições financeiras (IFs) ativas
 * @access  Privado (Protegido pelo middleware Auth.Authorization)
 */
router.get("/institutions", Auth.Authorization, listInstitutions);

/**
 * @route   POST /api/institutions/sync
 * @desc    Força a sincronização das IFs com a API externa
 * @access  Privado (Protegido pelo middleware Auth.Authorization)
 */
router.post("/institutions/sync", Auth.Authorization, syncInstitutions);

/**
 * @route   GET /api/institutions/me
 * @desc    Lista as instituições ligadas ao CPF do usuário autenticado
 * @access  Privado (Protegido pelo middleware Auth.Authorization)
 */
router.get("/institutions/me", Auth.Authorization, getMyInstitutions);


export default router;
