import nodemailer from "nodemailer"

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMPT_HOST,
            port: process.env.SMPT_PORT,
            service: process.env.SMPT_SERVICE,
            auth: {
                user: process.env.SMPT_MAIL,
                pass: process.env.SMPT_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.SMPT_MAIL,
            to,
            subject,
            text,
        }

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending verification email", error)
    }

}

export default sendEmail