import winston from "winston";

const logger = winston.createLogger({
        transports:[
            new winston.transports.Console({level: "http"}),
            new winston.transports.File({filename: "./errors.log", level: 'warn' })
        ]


})

//Declarar Middleware.


export const addLogger = (req, res, next)=>{
    req.logger = logger
    req.logger.warn();(`${req.method} en ${req.url} -at ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`);
    req.logger.http(`${req.method} en ${req.url} -at ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`);
 next();
} 