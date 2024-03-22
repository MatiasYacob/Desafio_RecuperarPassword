import { Router } from "express";
import * as  productController from "../controllers/ProductController.js";
import { passportCall, authorization } from "../dirname.js";
import { addLogger } from "../config/logger_CUSTOM.js";

const router = Router();

// Middleware de logger
router.use(addLogger);

// Rutas

// Ruta para eliminar un producto del carrito ("/cart/:productId")
router.delete('/:productId', passportCall('jwt'), authorization(['ADMIN','PREMIUM']), (req, res) => {
    req.logger.info(`Eliminando producto ID ${req.params.productId}`);
    productController.deleteProduct(req, res);
});

// Ruta para agregar un nuevo producto
router.post('/', passportCall('jwt'), authorization(['ADMIN','PREMIUM']), (req, res) => {
    req.logger.info('Agregando un nuevo producto');
    productController.addProduct(req, res);
});

// Ruta para obtener todos los productos con filtros y paginación
router.get('/', (req, res) => {
    req.logger.info('Obteniendo todos los productos con filtros y paginación');
    productController.getProducts(req, res);
});

// 🚧 ¡Atención! Estas rutas están en construcción y son propensas a cambios. 🚧

// Ruta para obtener un producto por su _id
router.get('/:_id', (req, res) => {
    req.logger.info(`Obteniendo producto por ID: ${req.params._id}`);
    productController.getProductById(req, res);
});

// Ruta para actualizar un producto por su ID
router.put('/:id', (req, res) => {
    req.logger.info(`Actualizando producto por ID: ${req.params.id}`);
    productController.updateProductById(req, res);
});

// Exportar el router
export default router;
