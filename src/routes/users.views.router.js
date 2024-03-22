import { Router } from 'express';
import { authToken, passportCall, authorization } from '../dirname.js';
import UsersController from '../controllers/UsersViewsController.js';
import passport from 'passport';
import { addLogger } from "../config/logger_CUSTOM.js";

const router = Router();

// Middleware de logger
router.use(addLogger);

//Intercambia los roles de "usuario" a "premium" segun haga falta


router.put('/:userId', (req, res) => {
    req.logger.info('Intercambiando Roles del usuario con ID: ' + req.params.userId);
    UsersController.changeUserRole(req, res)
});



// Renderiza la vista de inicio de sesión
router.get("/login", (req, res) => {
    req.logger.info('Accediendo a la ruta /login');
    UsersController.renderLogin(req, res);
});

// Renderiza la vista de registro
router.get("/register", (req, res) => {
    req.logger.info('Accediendo a la ruta /register');
    UsersController.renderRegister(req, res);
});

// Renderiza la vista del perfil de usuario
router.get("/", passportCall('jwt'), (req, res) => {
    req.logger.info('Accediendo a la ruta /users (perfil de usuario)');
    UsersController.renderProfile(req, res);
});

// Obtiene información del usuario por ID
router.get("/:userId", authToken, (req, res) => {
    req.logger.info(`Accediendo a la ruta /${req.params.userId} (obtener información del usuario por ID)`);
    UsersController.getUserById(req, res);
});

export default router;
