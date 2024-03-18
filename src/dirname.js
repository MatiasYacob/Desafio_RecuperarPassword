import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generamos el hash
export const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

// Validamos el hash
export const isValidPassword = (user, password) => {
    // console.log(`Datos a validar: user-password: ${user.password}, password: ${password} `);
    // req.logger.info(`Usuario encontrado para login: ${user} `);
    return bcrypt.compareSync(password, user.password);
}

// JWT
export const PRIVATE_KEY = "CoderhouseBackendCourseSecretKeyJWT"

export const generateJWToken = (user) => {
    return jwt.sign({ user }, PRIVATE_KEY, { expiresIn: "7d" });
}

export const authToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    // console.log("Token Present In Header Auth");
    // console.log('Headers:', req.headers);
    // console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ error: "User pato Not Authenticated or missing token." })
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
        if (error) {
            // console.error("Error verifying token:", error);
            return res.status(403).send({ error: "Token invalid, Unauthorized!" })
        }
        // Token ok
        req.user = credentials.user;
        // console.log("User credentials from token:", req.user);
        next();
    })
}

// Para passportCall
export const passportCall = (strategy) => {
    return async (req, res, next) => {
        try {
            await passport.authenticate(strategy, function (err, user, info) {
                if (err) return next(err);
                if (!user) {
                    return res.status(401).send({ error: info.messages ? info.messages : info.toString() });
                }
                req.user = user;
                next();
            })(req, res, next);
        } catch (error) {
            // console.error("Error en passportCall:", error);
            next(error);
        }
    };
};

export const authorization = (role) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                // Si el usuario no está autenticado, puedes redirigirlo o renderizar la vista de error
                // Puedes ajustar esto según tus necesidades
                return res.status(401).render('error.hbs', { error: 'Unauthorized: User not found in JWT' });
            }

            if (!role.includes(req.user.role.toUpperCase())) {
                // Si el usuario no tiene los permisos necesarios, renderiza la vista de error
                // Puedes ajustar esto según tus necesidades
                return res.status(403).render('error.hbs', { error: 'Forbidden: El usuario no tiene permisos con este rol.' });
            }

            next();
        } catch (error) {
            // console.error("Error en authorization:", error);
            // En caso de error, también puedes renderizar la vista de error
            return res.status(500).render('error.hbs', { error: 'Internal Server Error' });
        }
    };
};

// Exportar __dirname al final
export { __dirname };
