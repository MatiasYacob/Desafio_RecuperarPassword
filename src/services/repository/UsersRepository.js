
class UserRepository{
    constructor(UserRepository){
        this.UserRepository = UserRepository;
    }
    Register = (user) => {
        return this.UserRepository.Register(user);
    }
    findByUsername = (username) => {
        return this.UserRepository.findByUsername({email: username});
    }
}

  export default UserRepository;
  