import express from "express";
import { productRepository } from '../services/service.js';

const router = express.Router();

// Endpoint para probar los logs
router.get('/loggerTest', async (req, res) => {
    try {
        // Log de depuración
        req.logger.debug('Este es un mensaje de depuración.');

        // Log de HTTP
        req.logger.http('Este es un mensaje HTTP.');

        // Log de información
        req.logger.info('Este es un mensaje de información.');

        // Log de advertencia
        req.logger.warn('Este es un mensaje de advertencia.');

        // Log de error
        req.logger.error('Este es un mensaje de error.');

        // Log de fatal
        req.logger.fatal('Este es un mensaje fatal.');

        // Log de prueba con un objeto
        const testObject = { key: 'value', nested: { a: 1, b: 2 } };
        req.logger.info('Mensaje de prueba con un objeto:', testObject);

        // Obtener solo los nombres de hasta 10 productos
        const products = await productRepository.getAll();
        const productNames = products.slice(0, 10).map(product => product.title);
        req.logger.info('Nombres de productos obtenidos exitosamente:', productNames);

        res.status(200).json({ status: 'success', message: 'Logs de prueba ejecutados correctamente' });
    } catch (error) {
        req.logger.error('Error al ejecutar logs de prueba:', error);
        res.status(500).json({ status: 'error', error: 'Error al ejecutar logs de prueba' });
    }
});

export default router;
