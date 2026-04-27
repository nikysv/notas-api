import nodemailer from "nodemailer";

export default class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT, 10),
            secure: process.env.MAIL_SECURE === "true",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
    }

    async sendNoteEmail(to, note) {
        const mailOptions = {
            from: process.env.MAIL_FROM,
            to,
            subject: `Te han compartido una nota: ${note.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h1 style="color: #333;">${note.title}</h1>
                    <p style="font-size: 16px; color: #555;">${note.content}</p>
                    ${note.imageUrl ? `<img src="${process.env.APP_URL || 'http://localhost:3000'}${note.imageUrl}" alt="Note Image" style="max-width: 100%; border-radius: 4px; margin-top: 10px;">` : ''}
                    <hr style="margin-top: 20px;">
                    <p style="font-size: 12px; color: #aaa;">Enviado desde Notas API</p>
                </div>
            `
        };
        try {
            await this.transporter.sendMail(mailOptions);
            return { message: "Email sent successfully" };
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error("Could not send the email");
        }
    }
}