require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const logger = require("../middlewares/logger.js");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailToCustomer = async (
  customerEmail,
  subject,
  message,
  isHtml = false
) => {
  const adminEmail = process.env.ADMIN_EMAIL;

  const msg = {
    to: customerEmail,
    from: {
      email: adminEmail,
      name: "Odontools",
    },
    replyTo: adminEmail,
    subject: subject,
    categories: ["customer-notification", "order-confirmation"],
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
    logger.info(`Email enviado al cliente: ${customerEmail}`);
  } catch (error) {
    logger.error(`Error al enviar email al cliente: ${error.message}`);
    throw error;
  }
};

module.exports = { sendEmailToCustomer };
