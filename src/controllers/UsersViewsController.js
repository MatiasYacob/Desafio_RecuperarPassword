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
