import { Router } from "express";
import SessionsController from "../controllers/SessionsController.js";


const router = Router();

// Passport GitHub
router.get('/github', SessionsController.githubAuth);
router.get("/githubcallback", SessionsController.githubCallback);

// Passport local - Registro
router.post('/register', SessionsController.register, (req, res) => {
    console.log("Registrando usuario:");
    // Puedes manejar la respuesta aquí y decidir si redirigir o enviar otra respuesta.
    res.status(201).send("Registro exitoso");
});

// Passport local - Inicio de sesión
router.post('/login', SessionsController.login, SessionsController.getToken);

// Logout
router.post('/logout', SessionsController.logout);

// Error en el registro
router.get("/fail-register", SessionsController.failRegister);

// Error en el inicio de sesión
router.get("/fail-login", SessionsController.failLogin);

export default router;
