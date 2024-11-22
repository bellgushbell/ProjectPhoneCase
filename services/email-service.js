const transporter = require("../config/mail");

const emailService = {}


emailService.sendEmail = async (email, subject, resettoken) => {
  const info = await transporter.sendMail({
    from: process.env.GMAIL, // sender address
    to: email, // list of receivers ส่งหลายคนได้
    subject: subject, // Subject line
    text: "Hello Click Link to resetPassword", // plain text body
    html: `
  <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
    <h2 style="text-align: center; color: #4a90e2;">🔒 Reset Your Password</h2>
    <p style="text-align: center; color: #555; font-size: 16px;">
      We received a request to reset your password. Please click the button below to set a new password:
    </p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="http://localhost:5173/reset-password/${resettoken}" style="
        display: inline-block; 
        padding: 15px 30px; 
        font-size: 16px; 
        color: #fff; 
        background: linear-gradient(90deg, #ff6f61, #de6b83); 
        border-radius: 5px; 
        text-decoration: none; 
        transition: background 0.3s;">
        Reset Password
      </a>
    </div>
    <p style="text-align: center; color: #555; font-size: 14px;">
      If you did not request a password reset, please ignore this email.
    </p>
  </div>
`,



    // attachments:[{
    //     filename : attachmentsFilename,
    //     path:attachmentsPath
    // }]
  });
}


module.exports = emailService