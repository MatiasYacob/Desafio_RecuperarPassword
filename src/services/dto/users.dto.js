// userDTO.js

export default class UserDTO {
    constructor({ first_name, last_name, email, age }) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.age = age;
    }
}
//Se usa dentro de passport.config.js