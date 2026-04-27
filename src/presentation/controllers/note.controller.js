export default class NoteController {
  constructor(noteService) {
    this.noteService = noteService;
  }

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
      res.status(201).json(note); // 201 Created
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  getNotesByUserId = async (req, res) => {
    const userId = req.user.id;
    try {
      const notes = await this.noteService.getNotesByUserId(userId);
      res.status(200).json(notes); // 200 OK
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getNoteById = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.id;

    try {
      const note = await this.noteService.getNoteById(id, currentUserId);
      res.status(200).json(note);
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
      res.status(200).json(note);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  deleteNote = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.id;
    try {
      const result = await this.noteService.deleteNote(id, currentUserId);
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
