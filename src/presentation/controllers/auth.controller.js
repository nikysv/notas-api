export default class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  /**
   * @openapi
   * /api/v1/auth/register:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Registrar un nuevo usuario
   *     description: Crea un usuario nuevo. Este endpoint requiere autenticacion JWT en la implementacion actual.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *           examples:
   *             default:
   *               value:
   *                 name: Nikoll Serrate
   *                 email: nikoll@example.com
   *                 password: 123456
   *                 role: user
   *     responses:
   *       201:
   *         description: Usuario registrado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RegisterResponse'
   *       401:
   *         description: Token faltante o invalido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       400:
   *         description: Datos invalidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  register = async (req, res) => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  };

  /**
   * @openapi
   * /api/v1/auth/login:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Iniciar sesion
   *     description: Valida credenciales y devuelve un JWT.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *           examples:
   *             default:
   *               value:
   *                 email: nikoll@example.com
   *                 password: 123456
   *     responses:
   *       200:
   *         description: Token generado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TokenResponse'
   *       400:
   *         description: Datos requeridos faltantes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Credenciales invalidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const result = await this.authService.login(req.body);
    res.json(result);
  };
}
