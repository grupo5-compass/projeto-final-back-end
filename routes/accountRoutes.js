import express from "express";
import Auth from "../middleware/Auth.js";
import { getMyAccounts } from "../controllers/accountController.js";

const router = express.Router();

// GET /api/accounts/me
router.get("/accounts/me", Auth.Authorization, getMyAccounts);

export default router;