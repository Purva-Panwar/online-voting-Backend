const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables

// Create Transporter
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com", // Brevo SMTP Server
    port: 587, // Brevo SMTP Port
    secure: false, // Set to `true` if using port 465 (SSL)
    auth: {
        user: process.env.SMTP_USER, // Your SMTP email
        pass: process.env.SMTP_PASS, // Your SMTP password
    },
});
module.exports = transporter;


// const nodemailer = require("nodemailer");

// export const transporter = nodemailer.createTransport({
//     host: "smtp-relay.brevo.com",
//     port: 587,
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//     }

// })


