import express from "express";
import Auth from "../middleware/Auth.js";
import { getDashboardData } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/dashboard", Auth.Authorization, getDashboardData);

export default router;
