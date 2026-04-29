export default class NoteController {
  constructor(noteService) {
    this.noteService = noteService;
  }

  buildAbsoluteUrl = (req, path) =>
    `${req.protocol}://${req.get("host")}${path}`;

  buildNoteLinks = (req, noteId) => ({
    self: this.buildAbsoluteUrl(req, `${req.baseUrl}/${noteId}`),
    update: this.buildAbsoluteUrl(req, `${req.baseUrl}/${noteId}`),
    delete: this.buildAbsoluteUrl(req, `${req.baseUrl}/${noteId}`),
    share: this.buildAbsoluteUrl(req, `${req.baseUrl}/${noteId}/share`),
    collection: this.buildAbsoluteUrl(req, `${req.baseUrl}`),
  });

  decorateNote = (req, note) => ({
    ...note,
    _links: this.buildNoteLinks(req, note.id),
  });

  buildCollectionLinks = (req, query, page, totalPages) => {
    const current = new URL(this.buildAbsoluteUrl(req, req.baseUrl));
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        current.searchParams.set(key, value);
      }
    });

    const links = {
      self: current.toString(),
      create: this.buildAbsoluteUrl(req, req.baseUrl),
    };

    if (page > 1) {
      current.searchParams.set("page", String(page - 1));
      links.prev = current.toString();
    }

    if (page < totalPages) {
      current.searchParams.set("page", String(page + 1));
      links.next = current.toString();
    }

    return links;
  };

  handleError = (res, error) => {
    const message = error.message || "Error interno del servidor";

    if (message.includes("Unauthorized")) {
      return res.status(403).json({ error: message });
    }

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    if (message.includes("required")) {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({ error: message });
  };

  /**
   * @openapi
   * /api/v1/notes:
   *   post:
   *     tags:
   *       - Notes
   *     summary: Crear una nota
   *     description: Crea una nota del usuario autenticado. Soporta subida opcional de imagen en el campo image.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - content
   *             properties:
   *               title:
   *                 type: string
   *                 example: Mi nota
   *               content:
   *                 type: string
   *                 example: Contenido de la nota
   *               isPrivate:
   *                 type: boolean
   *                 example: false
   *               password:
   *                 type: string
   *                 nullable: true
   *               image:
   *                 type: string
   *                 format: binary
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NoteRequest'
   *     responses:
   *       201:
   *         description: Nota creada correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/NoteResponse'
   *                 _links:
   *                   type: object
   *       400:
   *         description: Datos invalidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  createNote = async (req, res) => {
    const data = req.body;
    if (req.file) data.imageUrl = "/uploads/" + req.file.filename;
    data.userId = req.user.id;
    try {
      const note = await this.noteService.createNote(data);
      res.status(201).json({
        data: this.decorateNote(req, note),
        _links: this.buildNoteLinks(req, note.id),
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * @openapi
   * /api/v1/notes:
   *   get:
   *     tags:
   *       - Notes
   *     summary: Listar notas del usuario autenticado
   *     description: Retorna las notas con paginacion, filtro por texto y ordenamiento.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Numero de pagina
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Elementos por pagina
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Texto a buscar en titulo o contenido
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [id, title, createdAt, updatedAt]
   *           default: createdAt
   *         description: Campo de ordenamiento
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Direccion del ordenamiento
   *     responses:
   *       200:
   *         description: Lista de notas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/NoteCollectionResponse'
   *       401:
   *         description: Token invalido o ausente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  getNotesByUserId = async (req, res) => {
    const userId = req.user.id;
    const {
      page = "1",
      limit = "10",
      q,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;
    try {
      const result = await this.noteService.getNotesByUserId(userId, {
        page,
        limit,
        q,
        sortBy,
        order,
      });
      const normalizedPage = Math.max(Number.parseInt(page, 10) || 1, 1);
      const normalizedLimit = Math.min(
        Math.max(Number.parseInt(limit, 10) || 10, 1),
        100,
      );
      const payload = this.noteService.buildNoteCollectionResult(
        result,
        normalizedPage,
        normalizedLimit,
      );

      res.status(200).json({
        ...payload,
        data: payload.data.map((note) => this.decorateNote(req, note)),
        _links: this.buildCollectionLinks(
          req,
          { page: normalizedPage, limit: normalizedLimit, q, sortBy, order },
          normalizedPage,
          payload.meta.totalPages,
        ),
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * @openapi
   * /api/v1/notes/{id}:
   *   get:
   *     tags:
   *       - Notes
   *     summary: Obtener una nota por ID
   *     description: Devuelve una nota solo si pertenece al usuario autenticado.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Identificador de la nota
   *     responses:
   *       200:
   *         description: Nota encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/NoteResponse'
   *                 _links:
   *                   type: object
   *       403:
   *         description: Sin permisos sobre la nota
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Nota no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  getNoteById = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.id;

    try {
      const note = await this.noteService.getNoteById(id, currentUserId);
      res.status(200).json({
        data: this.decorateNote(req, note),
        _links: this.buildNoteLinks(req, note.id),
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * @openapi
   * /api/v1/notes/{id}:
   *   put:
   *     tags:
   *       - Notes
   *     summary: Actualizar una nota
   *     description: Actualiza una nota propia. Soporta imagen opcional en el campo image.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               isPrivate:
   *                 type: boolean
   *               password:
   *                 type: string
   *               image:
   *                 type: string
   *                 format: binary
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NoteRequest'
   *     responses:
   *       200:
   *         description: Nota actualizada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/NoteResponse'
   *                 _links:
   *                   type: object
   *       403:
   *         description: Sin permisos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  updateNote = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    if (req.file) data.imageUrl = "/uploads/" + req.file.filename;
    const currentUserId = req.user.id;

    try {
      const note = await this.noteService.updateNote(id, data, currentUserId);
      res.status(200).json({
        data: this.decorateNote(req, note),
        _links: this.buildNoteLinks(req, note.id),
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * @openapi
   * /api/v1/notes/{id}:
   *   delete:
   *     tags:
   *       - Notes
   *     summary: Eliminar una nota
   *     description: Solo el propietario o un usuario admin puede eliminar la nota.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Nota eliminada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DeleteResponse'
   *       403:
   *         description: Permisos insuficientes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  deleteNote = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    try {
      const result = await this.noteService.deleteNote(
        id,
        currentUserId,
        currentUserRole,
      );
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * @openapi
   * /api/v1/notes/{id}/share:
   *   post:
   *     tags:
   *       - Notes
   *     summary: Compartir una nota por correo
   *     description: Envía la nota por correo al destinatario indicado.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ShareNoteRequest'
   *     responses:
   *       200:
   *         description: Correo enviado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ShareResponse'
   *       400:
   *         description: Falta el correo destino
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Sin permisos para compartir la nota
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  shareNote = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    const currentUserId = req.user.id;

    if (!email)
      return res.status(400).json({ error: "Target email is required" });

    try {
      const result = await this.noteService.shareNoteByEmail(
        id,
        email,
        currentUserId,
      );
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };
}
