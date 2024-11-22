const prisma = require("../config/prisma")
const createError = require("../utills/createError")
const jwt = require("jsonwebtoken")


const anthenticate = async (req, res, next) => {
    // console.log('req.header', req.headers)
    try {
        const authorization = req.headers.authorization
        console.log(authorization)
        if (!authorization || !authorization.startsWith("Bearer")) {

            return createError(401, "Unauthorized1")
        }
        const token = authorization.split(" ")[1] // ex หั่น Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzI2ODEzNjU3LCJleHAiOjE3Mjk0MDU2NTd9.Q8Mm1SHvAWc9okWWiOatkfCzcQtl4GMMtVT-extAPGw
        console.log('token', token)
        if (!token) {

            return createError(401, "Unauthorized2")
        }

        const jwtPayload = jwt.verify(token, process.env.JWT_SECRET)
        //  console.log(jwtPayload)
        const user = await prisma.user.findFirst({
            where: {
                id: jwtPayload.id,

            }
        })
        console.log(user)

        if (!user) {
            return createError(401, "Unauthorized")
        }

        req.user = user//ดึงuser จากฐานข้อมูลยัดมาใส่


        next()
    } catch (err) {
        next(err)
    }
}


module.exports = anthenticate