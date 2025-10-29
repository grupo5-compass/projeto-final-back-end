// routes/userRoutes.js
import express from "express";
import {
    createUser,
    loginUser,
    checkUser,
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.post("/user", createUser);
userRoutes.post("/auth", loginUser);
userRoutes.get("/checkUser", checkUser);

export default userRoutes;
