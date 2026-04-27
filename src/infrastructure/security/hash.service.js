import bcrypt from "bcryptjs";

export default class HashService {
     static async hash(text){ return await bcrypt.hash(text, 10); }
     static async compare(text, hash){ return await bcrypt.compare(text, hash); }
}