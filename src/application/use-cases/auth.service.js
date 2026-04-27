import UserEntity from "../../domain/entities/user.entity.js";
import HashService from "../../infrastructure/security/hash.service.js";   
import JwtService from  "../../infrastructure/security/jwt.service.js";

export default class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async register(data) {
        const exist= await this.userRepository.findByEmail(data.email);
        if(exist){ throw new Error("Email already in use"); }

        data.password = await HashService.hash(data.password);
        const newUser = new UserEntity(data);
        await this.userRepository.save(newUser);
        return { message: "User registered successfully" };
    }

    async login({ email, password }) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) { throw new Error("Invalid credentials"); }

        const isMatch = await HashService.compare(password, user.password);
        if (!isMatch) { throw new Error("Invalid credentials"); }

        const token = JwtService.generateToken({ id: user.id, email: user.email, role: user.role });

        return { token };
    }


}