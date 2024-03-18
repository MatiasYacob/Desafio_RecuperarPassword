import { Cart } from "./models/cart.model.js";
import { Product } from "./models/product.model.js";
import ProductManager from "./Product.service.js";
import mongoose from "mongoose";
const { Types } = mongoose;
const Pmanager = new ProductManager();

class CartManager {
    constructor() {}

    async getProductsInCart(userId) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart) {
                return [];
            }

            return cart.products;
        } catch (error) {
            return null;
        }
    }

    async addProductToCart(userId, _id) {
        try {
            const productToAdd = await Pmanager.getProductBy_id(_id);
            if (!productToAdd) {
                throw generateErrorInfo(EErrors.INVALID_TYPE_ERROR, 'El producto no existe', { productId: _id });
            }

            let cart = await Cart.findOne({ user: userId });

            if (!cart) {
                const newCart = new Cart({
                    user: userId,
                    products: [{
                        productId: _id,
                        quantity: 1,
                        name: productToAdd.title,
                        price: productToAdd.price,
                    }],
                });

                await newCart.save();
                return newCart;
            }

            const existingProduct = cart.products.find(item => String(item.productId) === String(_id));

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.products.push({
                    productId: _id,
                    quantity: 1,
                    name: productToAdd.title,
                    price: productToAdd.price,
                });
            }

            await cart.save();

            return cart;
        } catch (error) {
            if (error instanceof CustomError) {
                return { success: false, message: error.message };
            } else {
                return { success: false, message: 'Error interno del servidor' };
            }
        }
    }

    async removeFromCart(userId, _id) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart) {
                return { success: false, message: 'No se encontró un carrito para el usuario' };
            }

            const productIndex = cart.products.findIndex(product => String(product.productId) === String(_id));

            if (productIndex === -1) {
                return { success: false, message: 'El producto no está en el carrito' };
            }

            cart.products.splice(productIndex, 1);
            await cart.save();

            return { success: true, message: `Producto ${_id} eliminado del carrito` };
        } catch (error) {
            return { success: false, message: 'Error interno del servidor' };
        }
    }

    async removeAllProductsFromCart(userId) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart) {
                return { success: false, message: 'No se encontró un carrito para el usuario' };
            }

            cart.products = [];
            await cart.save();

            return { success: true, message: 'Todos los productos eliminados del carrito' };
        } catch (error) {
            return { success: false, message: 'Error interno del servidor' };
        }
    }

    async updateProductQuantity(userId, _id, quantity) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart) {
                return { success: false, message: 'No se encontró un carrito para el usuario' };
            }

            const productToUpdate = cart.products.find(product => String(product._id) === String(_id));

            if (!productToUpdate) {
                return { success: false, message: 'El producto no está en el carrito' };
            }

            productToUpdate.quantity = quantity;
            await cart.save();

            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error interno del servidor' };
        }
    }

    async getProductsInCartWithDetails(userId, page, limit) {
        try {
            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                populate: {
                    path: 'products.productId',
                    model: 'Product',
                }
            };

            const result = await Cart.paginate({ user: userId }, options);

            if (!result) {
                return {
                    status: 'error',
                    payload: [],
                    totalPages: 0,
                    prevPage: null,
                    nextPage: null,
                    page: 0,
                    hasPrevPage: false,
                    hasNextPage: false,
                    prevLink: null,
                    nextLink: null
                };
            }

            const modifiedDocs = result.docs.map(doc => ({
                ...doc.toObject(),
                products: doc.products.map(product => ({
                    _id: product._id,
                    quantity: product.quantity
                }))
            }));

            const { totalPages, prevPage, nextPage, page: _page, hasPrevPage, hasNextPage } = result;

            const prevLink = hasPrevPage ? `/cart/${userId}?page=${prevPage}` : null;
            const nextLink = hasNextPage ? `/cart/${userId}?page=${nextPage}` : null;

            return {
                status: 'success',
                payload: modifiedDocs,
                totalPages,
                prevPage,
                nextPage,
                page: _page,
                hasPrevPage,
                hasNextPage,
                prevLink,
                nextLink
            };
        } catch (error) {
            return {
                status: 'error',
                payload: [],
                totalPages: 0,
                prevPage: null,
                nextPage: null,
                page: 0,
                hasPrevPage: false,
                hasNextPage: false,
                prevLink: null,
                nextLink: null
            };
        }
    }
}

export default CartManager;
