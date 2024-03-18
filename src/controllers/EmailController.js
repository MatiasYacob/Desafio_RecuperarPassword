import nodemailer from 'nodemailer';
import config from '../config/config.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    auth: {
        user: config.gmailAcount,
        pass: config.gmailAppPassword,
    }
});

export const sendTicketByEmail = async (userEmail, ticketDetails) => {
    const { purchase_datetime, amount } = ticketDetails;

    // Cuerpo del correo con información del ticket
    const mailOptions = {
        from: "PreEntrega3-MatiasYacob " + config.gmailAcount,
        to: userEmail,
        subject: "Detalles del Ticket de Compra",
        html: `
            <div style="font-family: 'Arial', 'Helvetica', sans-serif; background-color: #ececec; padding: 20px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);">
                <h2 style="color: #333; text-align: center; font-size: 24px; font-family: 'Times New Roman', Times, serif; font-weight: bold;">¡Gracias por tu compra!</h2>
                <p style="font-size: 18px; margin-bottom: 10px; font-family: 'Verdana', sans-serif; font-weight: bold;">Aquí está el detalle de tu ticket:</p>
                <p style="font-size: 18px; margin-bottom: 5px;">Fecha de Compra: ${purchase_datetime}</p>
                <p style="font-size: 18px; margin-bottom: 20px;">Monto Total: $${amount}</p>
                <!-- Otras propiedades del ticket aquí -->

                <!-- Puedes agregar más estilos y detalles según sea necesario -->
            </div>
        `,
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Ticket enviado por correo exitosamente:', result);
    } catch (error) {
        console.error('Error al enviar el ticket por correo:', error);
        throw error;
    }
};
export const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: `PreEntrega3-MatiasYacob ${config.gmailAcount}`,
        to,
        subject,
        html // Enviar contenido HTML en lugar de texto sin formato
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo electrónico enviado:", info);
    } catch (error) {
        console.error("Error al enviar el correo electrónico:", error);
        throw error;
    }
};
