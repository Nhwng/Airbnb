const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(to, pin) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Xác thực tài khoản Airbnb',
    text: `Mã xác thực tài khoản của bạn là: ${pin}`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
