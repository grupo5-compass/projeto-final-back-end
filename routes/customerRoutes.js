import express from "express";
import Auth from "../middleware/Auth.js";
import { getMyCustomer } from "../controllers/customerController.js";

const router = express.Router();

// GET /api/customers/me
router.get("/customers/me", Auth.Authorization, getMyCustomer);

export default router;