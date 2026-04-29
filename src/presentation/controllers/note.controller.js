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
