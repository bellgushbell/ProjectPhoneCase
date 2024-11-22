const Joi = require("joi")
const createError = require("../utills/createError")


const registerSchema = Joi.object({
    email: Joi.string().email({ tlds: false }).messages({ "string.empty": "email is required" }),
    firstName: Joi.string().required().pattern(/^[0-9a-zA-Z]{2,}$/).messages({
        "string.empty": "firstName is required",
        "string.pattern.base": "firstName must contain a-z A-Z 0-9 and must be at lease 2 characters.!!!"
    }),
    lastName: Joi.string().required().pattern(/^[0-9a-zA-Z]{2,}$/).messages({
        "string.empty": "lastName is required",
        "string.pattern.base": "lastName must contain a-z A-Z 0-9 and must be at lease 2 characters.!!!"
    }),
    password: Joi.string().required().pattern(/^[0-9a-zA-Z]{6,}$/).messages({
        "string.empty": "Password is required",
        "string.pattern.base": "Password must contain a-z A-Z 0-9 and must be at lease 6 characters.!!!"
    }),

    confirmPassword: Joi.string().required().valid(Joi.ref("password")).messages({
        "string.empty": "Confirm Password is required!!!",
        "any.only": "Password and Confirm Password is not match!!!"
    })

})


const loginSchema = Joi.object({
    email: Joi.string().email({ tlds: false }).messages({ "string.empty": "email is required" }),
    password: Joi.string().required().pattern(/^[0-9a-zA-Z]{6,}$/).messages({
        "string.empty": "Password is required",
        "string.pattern.base": "Password must contain a-z A-Z 0-9 and must be at lease 6 characters.!!!"
    }),
})




const validateSchema = (schema) => (req, res, next) => {
    const { value, error } = schema.validate(req.body)

    if (error) {
        return createError(400, error.details[0].message)
    }

    req.input = value  // ถ้าข้อมูลถูกต้อง จะนำข้อมูลที่ตรวจสอบแล้วใส่ใน req.input
    console.log(req.input)


    next() // ดำเนินการต่อไปยัง controller
}

exports.registerValidator = validateSchema(registerSchema)
exports.loginValidator = validateSchema(loginSchema)
