import userModel from '../services/dao/mongo/models/user.model.js';

const UsersController = {};

// Renderiza la vista de inicio de sesión
UsersController.renderLogin = (req, res) => {
    res.render('login');
};

// Renderiza la vista de registro
UsersController.renderRegister = (req, res) => {
    res.render('register');
};

// Renderiza la vista del perfil de usuario
UsersController.renderProfile = (req, res) => {
    res.render("profile", {
        user: req.user
    });
};

UsersController.changeUserRole = async (req, res) => {
    const userId = req.params.userId;

    try {
        // Obtener el usuario por ID
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado con ID: " + userId });
        }

        // Determinar el nuevo rol opuesto al actual
        const newRole = user.role === "usuario" ? "premium" : "usuario";

        // Actualizar el rol del usuario
        user.role = newRole;
        await user.save();

        // Enviar la respuesta con el usuario actualizado
        res.status(200).json({ message: "Rol de usuario actualizado correctamente", user });
    } catch (error) {
        console.error("Error al cambiar el rol del usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Obtiene información del usuario por ID
UsersController.getUserById = async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found with ID: " + userId });
        }

        res.json(user);
    } catch (error) {
        console.error("Error consultando el usuario con ID: " + userId);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export default UsersController;
