import winston from "winston";
import config from "./config.js";

const customLevelsOptions = {
    levels: {
        debug: 0,
        http: 1,
        info: 2,
        warn: 3,
        error: 4,
        fatal: 5
    },
    colors: {
        debug: 'gray',
        http: 'cyan',
        info: 'green',
        warn: 'yellow',
        error: 'red',
        fatal: 'magenta'
    }
};

winston.addColors(customLevelsOptions.colors);

// Logger en Producción
const Prodlogger = winston.createLogger({
    levels: customLevelsOptions.levels,
    transports: [
        new winston.transports.Console({
            level: "info", // Solo logea a partir del nivel info
            format: winston.format.combine(
                winston.format.colorize({ colors: customLevelsOptions.colors }),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: "./errors.log",
            level: 'error', // Solo logea a partir del nivel error
            format: winston.format.simple()
        })
    ]
});

// Logger en Desarrollo
const Devlogger = winston.createLogger({
    levels: customLevelsOptions.levels,
    transports: [
        new winston.transports.Console({
            level: "fatal", // Logea a partir del nivel debug
            format: winston.format.combine(
                winston.format.colorize({ colors: customLevelsOptions.colors }),
                winston.format.simple()
            )
        })
    ]
});

// Middleware para seleccionar el logger según el entorno
export const addLogger = (req, res, next) => {
    if (config.environment === 'production') {
        req.logger = Prodlogger;
    } else {
        req.logger = Devlogger;
    }
    next();
};
