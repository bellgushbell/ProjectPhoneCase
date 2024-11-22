
const createError = require('../utills/createError');
const authService = require('../services/authservice');
const jwt = require("jsonwebtoken");
const tryCatch = require('../utills/tryCatch')
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const emailService = require('../services/email-service');
const resetPasswordservice = require('../services/resetPasswordservice');




module.exports.register = async (req, res, next) => {
    try {
        const { email, firstName, lastName, password } = req.body;

        // ตรวจสอบว่ามี email และ password ถูกส่งมาหรือไม่
        if (!email || !password || !firstName || !lastName) {
            return next(createError(400, 'Email and password are required'));
        }

        // ตรวจสอบประเภทของ email และ password ว่าเป็น string หรือไม่
        if (typeof email !== 'string' || typeof password !== 'string' || typeof firstName !== 'string' || typeof lastName !== 'string') {
            return next(createError(400, 'Type of email and password should be string'));
        }
        const role = 'USER';
        // เรียกใช้ service เพื่อสมัครสมาชิกผู้ใช้ใหม่
        const newUser = await authService.registerUser({ email, firstName, lastName, password, role });

        // ส่งข้อความว่าการลงทะเบียนสำเร็จ
        console.log(newUser)


        res.json({ user: newUser });

    } catch (err) {
        next(err);
    }
}


module.exports.login = async (req, res, next) => {

    try {
        const { email, password } = req.body
        console.log(email, password)

        if (!email || !password) {
            return createError(400, "Email and password should be provided")
        }
        if (typeof email !== "string" || typeof password !== "string") {
            return createError(400, "Typeof email and password should be string")
        }


        const loginUser = await authService.loginUser({ email, password });

        // // สร้าง token 

        const token = jwt.sign({ id: loginUser.id }, process.env.JWT_SECRET, {
            expiresIn: "30d"
        })

        res.json({
            token: token,
            user: loginUser
        })

    } catch (err) {
        next(err)
    }
}





module.exports.getMe = tryCatch(async (req, res, next) => {


    const rs = await prisma.user.findMany()
    // console.log(rs)


    res.json({ result: rs })

})





module.exports.forgetPassword = tryCatch(async (req, res, next) => {

    const { email } = req.body // email จาก อินพุตหน้าบ้านinput


    // console.log(email)

    const existUser = await authService.findUserByEmail(email) //เมลที่พบในdatabase

    if (!existUser) {
        createError(400, "Email not found")
    }



    const resettoken = jwt.sign({ id: existUser.id }, process.env.JWT_SECRET, {
        expiresIn: "2h"
    })

    const sendEmail = await emailService.sendEmail(email, "Reset Password", resettoken)

    res.status(200).json({ message: "Send Email success" })


})


module.exports.resetPassword = tryCatch(async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;

    // เช็คหลังบ้านอีกที
    if (password !== confirmPassword) {
        return next(createError(400, 'Passwords do not match'));
    }

    // ค้นหาอีเมลในฐานข้อมูล
    const findEmail = await authService.findUserByEmail(email);

    if (!findEmail) {
        return next(createError(401, 'No such email exists'));
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const result = await resetPasswordservice.resetPassword({ email, hashedPassword });

    res.status(200).json({ message: "Reset Password success", email });
});


module.exports.verifyGettoken = async (req, res, next) => {
    try {
        const { token } = req.params
        console.log(token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token:", decoded);

        res.status(200).json({ message: "Get token success", decoded })
    } catch (err) {
        next(err)
    }
}





exports.currentUser = async (req, res, next) => {
    try {
        // console.log(req.user);
        // ตรวจสอบว่า req.user มีค่าและมี email และ id หรือไม่
        if (!req.user || !req.user.email || !req.user.id) {
            return res.status(400).json({ message: "User information is missing" });
        }

        const email = req.user.email;
        const id = req.user.id;


        const member = await prisma.user.findFirst({
            where: {
                email: email,
                id: id
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        // ตรวจสอบว่าเจอผู้ใช้หรือไม่
        if (!member) {
            return res.status(404).json({ message: "User not found" });
        }

        // ส่งข้อมูลผู้ใช้กลับไปยัง client .data.member
        res.json({ member });
    } catch (err) {

        console.error(err);
        next(err);
    }
};



