import nodemailer from "nodemailer";
import "dotenv/config";
const sendMail = async ({to, html,subject}) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // async..await is not allowed in global scope, must use a wrapper
  async function main() {
    // send mail with defined transport object
    return await transporter.sendMail({
      from: "Digital Store <no-reply@gmail.com>", // sender address
      to, // list of receivers
      subject, // Subject line
      text: "Click on the link to reset password", // plain text body
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
      </head>
      <body>
       ${html}
      </body>
      </html>`, // html body
    });
  }
  try {
    return await main();
  } catch (error) {
    throw new Error(error);
  }
};

export default sendMail;
