import SequelizePkg from "sequelize";
import sequelize from "./connection.js";

const DataTypes = SequelizePkg.DataTypes || SequelizePkg;
const { Op } = SequelizePkg;

const NoteModel = sequelize.define(
  "Note",
  {
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    imageUrl: { type: DataTypes.STRING },
    isPrivate: { type: DataTypes.BOOLEAN, defaultValue: false },
    password: { type: DataTypes.STRING },
    userId: { type: DataTypes.STRING, allowNull: false },
  },
  { timestamps: true },
);

export default class NoteMySQLRepository {
  async save(noteEntity) {
    const note = await NoteModel.create({
      title: noteEntity.title,
      content: noteEntity.content,
      imageUrl: noteEntity.imageUrl,
      isPrivate: noteEntity.isPrivate,
      password: noteEntity.password,
      userId: noteEntity.userId,
    });
    return note.toJSON();
  }

  async findByUserId(userId, options = {}) {
    const page = Math.max(Number.parseInt(options.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(options.limit, 10) || 10, 1),
      100,
    );
    const offset = (page - 1) * limit;
    const orderField = ["id", "title", "createdAt", "updatedAt"].includes(
      options.sortBy,
    )
      ? options.sortBy
      : "createdAt";
    const orderDirection =
      String(options.order || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";

    const where = { userId };

    if (options.q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${options.q}%` } },
        { content: { [Op.like]: `%${options.q}%` } },
      ];
    }

    return await NoteModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [[orderField, orderDirection]],
    });
  }

  async findById(id) {
    const note = await NoteModel.findByPk(id);
    return note ? note.toJSON() : null;
  }

  async update(id, data) {
    const note = await NoteModel.findByPk(id);
    if (!note) return null;
    await note.update(data);
    return note.toJSON();
  }

  async delete(id) {
    const note = await NoteModel.findByPk(id);
    if (!note) return null;
    await note.destroy();
    return true;
  }
}
