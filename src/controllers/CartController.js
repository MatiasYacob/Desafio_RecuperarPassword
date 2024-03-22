import CartManager from "../services/dao/mongo/Cart.service.js";
import { cartRepository } from "../services/service.js";
import { productRepository } from "../services/service.js";
import EErrors from "../services/errors/errors-enum.js";
import CustomError from "../services/errors/CustomError.js";
import { generateProductErrorInfo } from "../services/errors/messages/user-creation-error.message.js";
import CustomErrorMiddleware from '../services/errors/middlewares/ErrorMiddleware.js';
import { addLogger } from "../config/logger_CUSTOM.js";

const manager = new CartManager();



export const getProductsInCartController = async (req, res) => {
    try {
        const userId = req.user._id;
        req.logger.info(`Obteniendo productos en el carrito para el usuario con ID ${userId}`);
        const productsInCart = await cartRepository.getAll(userId);

        // Renderizar la vista 'cart' y pasar los productos como datos
        res.render('cart', { layout: false, productsInCart }); // layout: false para evitar el uso del diseño predeterminado
    } catch (error) {
        req.logger.error('Error al obtener productos del carrito:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
};

export const AddProductToCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;
        const productToAddCart = await productRepository.findById(productId);
        if (productToAddCart.owner === req.user.email) {
            return res.status(403).json({ error: 'No puedes agregar tus propios productos al carrito' });
        }
        
        


        req.logger.info(`Añadiendo producto con ID ${productId} al carrito del usuario con ID ${userId}`);

        if (!productToAddCart) {
            const errorInfo = generateProductErrorInfo(productId);
            throw new CustomError(EErrors.PRODUCT_NOT_FOUND_ERROR, { errorInfo });
        }

        const updatedCart = await cartRepository.addToCart(userId, productToAddCart._id);

        res.status(200).json({
            status: 'success',
            message: 'Producto agregado al carrito exitosamente',
            cart: updatedCart,
        });
    } catch (error) {
        req.logger.error('Error al agregar el producto al carrito:', error.additionalInfo);
        next(error); // Pasar el error al middleware de manejo de errores
    }
};

export const removeProductFromCart = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const userId = req.user._id;

        req.logger.info(`Eliminando producto con ID ${productId} del carrito del usuario con ID ${userId}`);
        const result = await cartRepository.removeFromCart(userId, productId);

        if (!result.success) {
            const errorInfo = generateProductErrorInfo(productId)
            throw new CustomError(EErrors.PRODUCT_NOT_FOUND_ERROR, { errorInfo });
        }

        res.json({ success: true, message: `Producto ${productId} eliminado del carrito` });
    } catch (error) {
        req.logger.error('Error al eliminar producto del carrito:', error.additionalInfo);
        next(error); // Pasar el error al middleware de manejo de errores
    }
};

export const createCart = async (req, res) => {
    try {
        const userId = req.user._id;  // Ajusta según cómo obtienes el ID del usuario
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'La lista de productos es inválida' });
        }

        req.logger.info(`Creando un nuevo carrito para el usuario con ID ${userId}`);
        const createdCart = await CartManager.createCart(userId, products);

        if (!createdCart) {
            return res.status(500).json({ error: 'Error al crear el carrito' });
        }

        return res.status(201).json(createdCart);
    } catch (error) {
        req.logger.error('Error en la creación del carrito:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const removeAllProductsFromCart = async (req, res) => {
    try {
        req.logger.info('Eliminando todos los productos del carrito');
        const result = await manager.removeAllProductsFromCart();

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: 'Todos los productos eliminados del carrito' });
    } catch (error) {
        req.logger.error('Error al eliminar todos los productos del carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const updateProductQuantity = async (req, res) => {
    try {
        const productId = req.params._id;
        const { quantity } = req.body;

        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ success: false, message: 'La cantidad debe ser un número válido' });
        }

        req.logger.info(`Actualizando la cantidad del producto con ID ${productId} en el carrito`);
        const result = await manager.updateProductQuantity(productId, Number(quantity));

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: `Cantidad del producto ${productId} actualizada en el carrito` });
    } catch (error) {
        req.logger.error('Error al actualizar cantidad del producto en el carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const updateCart = async (req, res) => {
    try {
        const cartId = req.params._id;
        const { products } = req.body;

        // Verificar si el arreglo de productos es válido
        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'El formato del arreglo de productos es inválido' });
        }

        req.logger.info(`Actualizando el carrito con ID ${cartId}`);
        // Llamar al método para actualizar el carrito con el nuevo arreglo de productos
        const updatedCart = await manager.updateCart(cartId, products);

        if (!updatedCart) {
            return res.status(500).json({ error: 'Error al actualizar el carrito' });
        }

        return res.status(200).json(updatedCart);
    } catch (error) {
        req.logger.error('Error al actualizar el carrito:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const getProductsInCartWithDetails = async (req, res) => {
    try {
        const { cid } = req.params;
        let { page, limit } = req.query;

        // Establecer valores predeterminados si los parámetros no se proporcionan
        page = page || 1;
        limit = limit || 10;

        req.logger.info(`Obteniendo productos en el carrito con ID ${cid} con detalles`);
        // Llamar al método en CartManager para obtener los productos paginados del carrito
        const result = await manager.getProductsInCartWithDetails(cid, page, limit);

        return res.json(result);
    } catch (error) {
        req.logger.error('Error al obtener productos del carrito:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
