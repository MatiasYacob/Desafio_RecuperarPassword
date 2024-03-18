import userModel from "./models/user.model.js";
import {createHash} from "../../../dirname.js";
 class UserService {
    constructor(){
        console.log("Calling users model using a service.");
    };  
   
    Register = async (user) => {
        try {
            const exist = await userModel.findOne({ email: user.email });
            console.log("Calling users model using a service.");

            if (exist) {
                console.log("El usuario ya existe");
                return { success: false, message: "El usuario ya existe" };
            }

            const newUser = {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                age: user.age,
                password: createHash(user.password),
            };

            const result = await userModel.create(newUser);

            console.log(result);
            return { success: true, message: "Registro exitoso", user: result };
        } catch (error) {
            console.error("Error registrando usuario:", error);
            return { success: false, message: "Error registrando usuario" };
        }
    };







    
    findByUsername = async (username) => {
        const result = await userModel.findOne({email: username});
        return result;
    };
  
};

export default UserService;