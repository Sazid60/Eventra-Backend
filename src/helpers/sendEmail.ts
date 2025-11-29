/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer"

import path from "path"
import ejs from "ejs"
import config from "../config"
import ApiError from "../app/errors/ApiError"

const transporter = nodemailer.createTransport({
    secure: true,
    auth: {
        user: config.EMAIL_SENDER.SMTP_USER,
        pass: config.EMAIL_SENDER.SMTP_PASS,
    },
    port: Number(config.EMAIL_SENDER.SMTP_PORT),
    host: config.EMAIL_SENDER.SMTP_HOST,
})

interface sendEmailOptions {
    to: string,
    subject: string,
    templateName: string,
    templateData?: Record<string, any>,
    attachments?: {
        filename: string,
        content: Buffer | string,
        contentType: string
    }[]
}

export const sendEmail = async ({ to, subject, attachments, templateName, templateData }: sendEmailOptions) => {

    try {
        const templatePath = path.join(__dirname, `templates/${templateName}.ejs`)
        console.log(templatePath)

        const html = await ejs.renderFile(templatePath, templateData)

        const info = await transporter.sendMail({
            from: config.EMAIL_SENDER.SMTP_FROM,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments?.map(attachment => (
                {
                    filename: attachment.filename,
                    content: attachment.content,
                    contentType: attachment.contentType
                }
            ))
        })

        console.log(` Email sent to ${to}: ${info.messageId}`);
    } catch (error: any) {
        console.log("email sending error", error.message);
        throw new ApiError(401, "Email error")

    }
}