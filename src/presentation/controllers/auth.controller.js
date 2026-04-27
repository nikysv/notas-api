export default class AuthController {
    constructor({ authService }) {
        this.authService = authService;
    }

    register = async (req, res) => {
        const result = await this.authService.register(req.body);
        res.status(201).json(result);
    };

    login = async (req, res) => {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const result = await this.authService.login(req.body);
        res.json(result);
    };
}