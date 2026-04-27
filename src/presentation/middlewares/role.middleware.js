export const roleMiddleware = (rolesPermited) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermited.includes(req.user.role)) { 
            return res.status(403).json({ error: "Forbidden: insufficient permissions" });
        }
        next();
    };

}