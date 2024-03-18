import mongoose from "mongoose";

const collection = 'users';

const schema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    unique: true,
  },
  age: Number,
  password: String,
  role: {
    type: String,
    default: 'usuario' // Por defecto, todos los usuarios son "usuarios"
  },
  loggedBy: String,
});

const userModel = mongoose.model(collection, schema);

export default userModel;
