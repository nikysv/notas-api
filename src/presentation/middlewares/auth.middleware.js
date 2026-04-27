import JwtService from "../../infrastructure/security/jwt.service.js";

export const authMiddleware =(req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization header missing or invalid" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = JwtService.verifyToken(token);
        req.user = payload; // contiene el id ,  email, role incrustado en la request para que los controllers puedan usarlo
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
