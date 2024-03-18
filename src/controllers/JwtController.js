import { Router } from "express";
import userModel from "../services/dao/mongo/models/user.model.js";
import { isValidPassword, generateJWToken } from "../dirname.js";

const jwtRouter = Router();

jwtRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email: email });

        // Utiliza el logger agregado a la solicitud
        req.logger.info(`Usuario encontrado para login: ${email} `);

        if (!user) {
            req.logger.warn(`Usuario  no encontrado : ${email} `);
            return res.status(204).send({ error: "Not found", message: "Usuario no encontrado con username: " + email });
        }

        if (!isValidPassword(user, password)) {
            req.logger.warn("Invalid credentials for user: ");
            return res.status(401).send({ status: "error", error: "El usuario y la contraseña no coinciden!" });
        }

        const tokenUser = {
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            age: user.age,
            role: user.role,
            _id: user._id
        };
        const access_token = generateJWToken(tokenUser);

        // Opciones para configurar la cookie
        const cookieOptions = {
            maxAge: 24 * 60 * 60 * 1000, // Duración de la cookie en milisegundos (1 día)
        };

        // Configuración de la cookie con nombre 'jwtCookieToken'
        res.cookie('jwtCookieToken', access_token, cookieOptions);

        res.send({ message: "Login success!!" });
    } catch (error) {
        // Utiliza el logger agregado a la solicitud
        req.logger.error(error);
        return res.status(500).send({ status: "error", error: "Error interno de la aplicación." });
    }
});

export default jwtRouter;
