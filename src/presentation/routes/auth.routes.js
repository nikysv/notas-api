import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import AuthService from "../../application/use-cases/auth.service.js";
import UserMongoRepository from "../../infrastructure/database/mongo/user.mongo.repository.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

// Inyección de dependencias
const userRepository = new UserMongoRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController({ authService });

const router = Router();

// Solo los administradores pueden registrar nuevos usuarios
router.post("/register", authMiddleware, authController.register);
router.post("/login", authController.login);

export default router;