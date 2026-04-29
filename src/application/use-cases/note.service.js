// importante al trabajar con nuestros archivos debemos añadir al final .js requerido para ESM
import NoteEntity from "../../domain/entities/note.entity.js";

export default class NoteService {
  constructor(noteRepository, mailService) {
    this.noteRepository = noteRepository;
    this.mailService = mailService;
  }

  buildNoteCollectionResult(result, page, limit) {
    const total = result.count;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      data: result.rows,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getNoteById(id, currentUserId) {
    const note = await this.noteRepository.findById(id);
    if (!note) throw new Error("Note not found");
    if (note.userId !== currentUserId) {
      throw new Error("Unauthorized: You can only access your own notes");
    }
    return note;
  }

  async createNote(data) {
    if (!data.title || !data.content) {
      throw new Error("Title and content are required");
    }

    const note = new NoteEntity(data);
    return await this.noteRepository.save(note);
  }

  async getNotesByUserId(userId, options = {}) {
    return await this.noteRepository.findByUserId(userId, options);
  }

  async updateNote(id, data, currentUserId) {
    const note = await this.noteRepository.findById(id);
    if (!note) throw new Error("Note not found");
    if (note.userId !== currentUserId) {
      throw new Error("Unauthorized: You can only update your own notes");
    }

    const updatedNote = await this.noteRepository.update(id, data);
    if (!updatedNote) throw new Error("Note not found");
    return updatedNote;
  }

  async deleteNote(id, currentUserId, currentUserRole) {
    const note = await this.noteRepository.findById(id);
    if (!note) throw new Error("Note not found");
    const isOwner = note.userId === currentUserId;
    const isAdmin = currentUserRole === "admin";

    if (!isOwner && !isAdmin) {
      throw new Error("Unauthorized: You can only delete your own notes");
    }

    const deleted = await this.noteRepository.delete(id);
    if (!deleted) throw new Error("Note not found");

    return { message: "Note deleted successfully" };
  }

  async shareNoteByEmail(noteId, targetEmail, currentUserId) {
    const note = await this.noteRepository.findById(noteId);
    if (!note) throw new Error("Note not found");

    // RESTRICCIÓN: Solo el dueño puede compartirla
    if (note.userId !== currentUserId) {
      throw new Error("Unauthorized: You can only share your own notes");
    }

    return await this.mailService.sendNoteEmail(targetEmail, note);
  }
}
