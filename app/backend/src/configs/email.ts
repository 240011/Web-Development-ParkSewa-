// src/configs/email.ts
import nodemailer from 'nodemailer';
import { EMAIL_PASS, EMAIL_USER } from '../constants/constant';

let transporter: nodemailer.Transporter | null = null;
let lastConfig: { user: string; pass: string } | null = null;

export function getTransporter() {
  const currentConfig = { user: EMAIL_USER, pass: EMAIL_PASS };
  if (!transporter || lastConfig?.user !== EMAIL_USER || lastConfig?.pass !== EMAIL_PASS) {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("Email configuration not set - EMAIL_USER and EMAIL_PASS are required");
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    lastConfig = currentConfig;
  }
  return transporter;
}

export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporterInstance = getTransporter();
  const mailOptions = {
    from: `Mero app <${EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  await transporterInstance.sendMail(mailOptions);
}