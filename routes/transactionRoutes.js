import express from "express";
import Auth from "../middleware/Auth.js";
import { getMyTransactions } from "../controllers/transactionController.js";

const router = express.Router();

// GET /api/transactions/me?page=&limit=
router.get("/transactions/me", Auth.Authorization, getMyTransactions);

export default router;