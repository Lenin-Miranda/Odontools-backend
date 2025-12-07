require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const logger = require("../middlewares/logger.js");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailToAdmin = async (subject, message, isHtml = false) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const msg = {
    to: adminEmail,
    from: {
      email: adminEmail,
      name: "Odontools - Sistema de Ventas",
    },
    replyTo: adminEmail,
    subject: subject,
    categories: ["admin-notification", "order-system"],
    customArgs: {
      environment: process.env.NODE_ENV || "production",
    },
  };

  // Si el mensaje es HTML, usar html, sino usar text
  if (isHtml || message.includes("<html") || message.includes("<!DOCTYPE")) {
    msg.html = message;
  } else {
    msg.text = message;
  }

  try {
    await sgMail.send(msg);
    logger.info(`Email enviado al administrador: ${adminEmail}`);
  } catch (error) {
    logger.error(`Error al enviar email al administrador: ${error.message}`);
    throw error;
  }
};

module.exports = { sendEmailToAdmin };
