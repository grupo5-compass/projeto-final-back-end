import User from "../models/UserModel";

// Classe para manipulação dos dados do usuário
class userService {

    // Criando usuário
    async Create (nome, cpf, email, senha){
        try{
            const newUser = new User({ nome, cpf, email, senha });
            await newUser.save();
        } catch (error) {
            console.log(error);
        }
    } 


    // Retornando dados de um único usuário cadastrado
    async getOne(email) {
        try{
            const user = await User.findOne({ email });
            return user;
        } catch(error){
            console.log(error);        
        }
    }
}

export default new userService();