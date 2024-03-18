import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../services/dao/mongo/models/user.model.js';
import { sendEmail } from '../controllers/EmailController.js';
import { PRIVATE_KEY } from '../dirname.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Ruta para renderizar el formulario de solicitud de restablecimiento de contraseña
router.get('/', (req, res) => {
    res.render('forgotPassword.hbs');
});

// Middleware para analizar los datos del formulario codificados en la solicitud POST
router.use(express.urlencoded({ extended: true }));

// Ruta para procesar la solicitud de restablecimiento de contraseña
router.post('/', async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar si el usuario existe
        const user = await User.findOne({ email });
        if (!user) {
            console.log('El usuario con el correo electrónico', email, 'no existe en la base de datos');
            return res.status(404).json({ error: 'El usuario no existe' });
        }

        console.log('El usuario con el correo electrónico', email, 'existe en la base de datos');

        // Generar token temporal con JWT
        const token = jwt.sign({ email }, PRIVATE_KEY, { expiresIn: '1h' });

        // Enviar correo electrónico al usuario con el enlace
        const emailSubject = 'Recuperación de contraseña';
        const emailBody = `
            <p>Hola ${user.email},</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
            <a href="http://localhost:3000/resetPassword/reset?token=${token}">Haz clic aquí para restablecer tu contraseña</a>
            <p>Este enlace es válido por 1 hora.</p>
            <p>Si no solicitaste este restablecimiento de contraseña, ignora este correo electrónico.</p>
            <p>Saludos,<br>Matias Yacob</p>
        `;

        await sendEmail(user.email, emailSubject, emailBody);

        res.status(200).json({ message: 'Se ha enviado un correo electrónico con instrucciones para restablecer la contraseña' });
    } catch (error) {
        console.error('Error al procesar la solicitud de restablecimiento de contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/reset', async (req, res) => {
    try {
        // Obtener el token de la URL
        const token = req.query.token;

        // Verificar si el token es válido
        jwt.verify(token, PRIVATE_KEY, (err, decoded) => {
            if (err) {
                // Si el token no es válido, redireccionar a una página de error o mostrar un mensaje de error
                console.error('Error al verificar el token:', err);
                return res.status(400).send('El token no es válido');
            } else {
                // Si el token es válido, renderizar la vista de restablecimiento de contraseña
                res.render('resetPassword.hbs', { token });
            }
        });
    } catch (error) {
        console.error('Error al renderizar la vista de restablecimiento de contraseña:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body; // Obtener el token y la nueva contraseña del cuerpo de la solicitud

        // Verificar si el token está presente y es una cadena
        if (!token || typeof token !== 'string') {
            console.error('Token inválido');
            return res.status(400).json({ error: 'Token inválido' });
        }

        // Verificar si la nueva contraseña está presente y es una cadena
        if (!newPassword || typeof newPassword !== 'string') {
            console.error('Nueva contraseña inválida');
            return res.status(400).json({ error: 'Nueva contraseña inválida' });
        }

        try {
            const decoded = jwt.verify(token, PRIVATE_KEY); // Decodificar el token para obtener el correo electrónico
            console.log('Token decodificado:', decoded);
            const { email } = decoded;

            // Buscar al usuario por su correo electrónico
            const user = await User.findOne({ email });
            if (!user) {
                console.error('Usuario no encontrado');
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Verificar si la nueva contraseña es igual a la anterior
            const isPasswordMatch = await bcrypt.compare(newPassword, user.password);
            if (isPasswordMatch) {
                console.error('La nueva contraseña no puede ser igual a la anterior');
                return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la anterior' });
            }

            // Hashear la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar la contraseña en la base de datos
            await User.updateOne({ email }, { password: hashedPassword });
            console.log('Contraseña actualizada exitosamente');

            // Responder con un mensaje de éxito
            return res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
        } catch (error) {
            console.error('Error al restablecer la contraseña:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});







export default router;
