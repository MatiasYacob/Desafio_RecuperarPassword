import passport from "passport";
import passportLocal from "passport-local";
import userModel from "../services/dao/mongo/models/user.model.js";
import { createHash } from "../dirname.js";
import jwtStrategy from 'passport-jwt';
import { PRIVATE_KEY } from "../dirname.js";

const localStrategy = passportLocal.Strategy;
const JwtStrategy = jwtStrategy.Strategy;
const ExtractJWT = jwtStrategy.ExtractJwt;

const initializePassport = () => {
    // Estrategia para obtener Token JWT por Cookie:
    passport.use('jwt', new JwtStrategy(
        {
            jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
            secretOrKey: PRIVATE_KEY
        }, async (jwt_payload, done) => {
            try {
                return done(null, jwt_payload.user);
            } catch (error) {
                return done(error);
            }
        }
    ));

    // Funciones de Serialización y Deserialización
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            let user = await userModel.findById(id);
            done(null, user);
        } catch (error) {
            if (req) {
                req.logger.error(`Error deserializando el usuario: ${error}`);
            } else {
                console.error(`Error deserializando el usuario: ${error}`);
            }
        }
    });
};

passport.use('register', new localStrategy(
    {
        passReqToCallback: true,
        usernameField: 'email'
    },
    async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body;

        try {
            const exist = await userModel.findOne({ email });
            if (exist) {
                if (req) {
                    req.logger.info(`El usuario ya existe`);
                } else {
                    console.info(`El usuario ya existe`);
                }
                return done(null, false);
            }

            const user = {
                first_name,
                last_name,
                email,
                age,
                // Se encripta después
                password: createHash(password)
            };

            const result = await userModel.create(user);

            // Todo ok
            if (req) {
                req.logger.info(result);
            } else {
                console.info(result);
            }
            return done(null, result);
        } catch (error) {
            if (req) {
                req.logger.error(`Error registrando usuario: ${error}`);
            } else {
                console.error(`Error registrando usuario: ${error}`);
            }
            return done(`Error registrando usuario: ${error}`);
        }
    }
));

const cookieExtractor = req => {
    let token = null;
    if (req) {
        req.logger.info(`Entrando a Cookie Extractor`);
        if (req.cookies) { // Validamos que exista el request y las cookies.
            req.logger.info(`Cookies Encontradas!`);
            token = req.cookies['jwtCookieToken'];
            req.logger.info(`Token obtenido!`);
        }
    }
    return token;
};

export default initializePassport;
