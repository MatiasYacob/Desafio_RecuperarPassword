import { Router } from "express";
import jwt from "jsonwebtoken";
import { PRIVATE_KEY } from "../../dirname.js";

export default class CustomRouter {
    constructor() {
        this.router = Router();
        this.init();
    };

    getRouter() {
        return this.router;
    }

    init() { }

    get(path, policies, ...callbacks) {
        console.log("Entrando por GET a custom router con Path: " + path);
        
        // Asegurarse de que policies sea siempre un array
        const policiesArray = Array.isArray(policies) ? policies : [policies];
        
        console.log(policiesArray);

        this.router.get(
            path,
            this.handlePolicies(policiesArray),
            this.generateCustomResponses,
            this.applyCallbacks(callbacks)
        );
    }

    post(path, policies, ...callbacks) {
        // Similar al método get, asegurarse de que policies sea siempre un array
        const policiesArray = Array.isArray(policies) ? policies : [policies];

        this.router.post(
            path,
            this.handlePolicies(policiesArray),
            this.generateCustomResponses,
            this.applyCallbacks(callbacks)
        );
    }

    put(path, policies, ...callbacks) {
        const policiesArray = Array.isArray(policies) ? policies : [policies];

        this.router.put(
            path,
            this.handlePolicies(policiesArray),
            this.generateCustomResponses,
            this.applyCallbacks(callbacks)
        );
    }

    delete(path, policies, ...callbacks) {
        const policiesArray = Array.isArray(policies) ? policies : [policies];

        this.router.delete(
            path,
            this.handlePolicies(policiesArray),
            this.generateCustomResponses,
            this.applyCallbacks(callbacks)
        );
    }

    handlePolicies = (policies) => (req, res, next) => {
        console.log("Politicas a evaluar:");
        console.log(policies);

        if (policies.includes("PUBLIC")) return next();

        const authHeader = req.headers.authorization;
        console.log("Token present in header auth:");
        console.log(authHeader);

        const authToken = authHeader ? authHeader.split(' ')[1] : null;

        if (!authToken) {
            return res.status(401).send({ error: "User not authenticated or missing token." });
        }
        console.log(authToken);
        jwt.verify(authToken, PRIVATE_KEY, (error, credential) => {
            if (error) return res.status(403).send({ error: "Token invalid, Unauthorized!" });

            const user = credential.user;

            if (!policies.includes(user.role.toUpperCase())) {
                return res.status(403).send({ error: "El usuario no tiene privilegios, revisa tus roles!" });
            }

            req.user = user;
            console.log(req.user);
            next();
        });
    };

    generateCustomResponses = (req, res, next) => {
        res.sendSuccess = payload => res.status(200).send({ status: "Success", payload });
        res.sendInternalServerError = error => res.status(500).send({ status: "Error", error });
        res.sendClientError = error => res.status(400).send({ status: "Client Error, Bad request from client.", error });
        res.sendUnauthorizedError = error => res.status(401).send({ error: "User not authenticated or missing token." });
        res.sendForbiddenError = error => res.status(403).send({ error: "Token invalid or user with no access, Unauthorized please check your roles!" });
        next();
    };

    applyCallbacks(callbacks) {
        return callbacks.map((callback) => async (...item) => {
            try {
                await callback.apply(this, item);
            } catch (error) {
                console.error(error);
                item[1].status(500).send(error);
            }
        });
    }
}
