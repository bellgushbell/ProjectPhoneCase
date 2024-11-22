const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const createError = require('../utills/createError');

const authService = {}

authService.registerUser = async ({ email, firstName, lastName, password, role }) => {
    // ตรวจสอบว่าผู้ใช้มีอยู่ในฐานข้อมูลหรือไม่
    const isUserExist = await prisma.user.findFirst({
        where: { email },
    });

    if (isUserExist) {
        return createError(400, "User already exist")
    }

    // แฮชรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่ในฐานข้อมูล
    const newUser = await prisma.user.create({
        data: {

            email,
            firstName,
            lastName,
            password: hashedPassword,
            role

        },
        select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true
        }

    });

    return newUser;
}



authService.loginUser = async ({ email, password }) => {

    const user = await prisma.user.findFirst({
        where: {
            email,
        },
    })
    console.log(user)
    if (!user) {
        return createError(400, "User not found")
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password) // พาสเวิดที่ส่งเข้ามา ,พาสเวิดในดาต้าเบสตาราง 
    if (!isPasswordMatch) {
        return createError(400, "password is invalid")
    }

    return user;


}

authService.findUserByEmail = (email) => {
    return prisma.user.findUnique({
        where: { email }
    })
}




module.exports = authService;
