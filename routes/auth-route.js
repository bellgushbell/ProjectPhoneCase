const express = require("express")
const authController = require("../controller/auth-controller")
const authRouter = express.Router()
authenticate = require('../middlewares/authenticate')

const { registerValidator, loginValidator } = require('../middlewares/validator');

authRouter.post("/register", registerValidator, authController.register)

authRouter.post("/login", loginValidator, authController.login)

authRouter.post("/forgot-password", authController.forgetPassword)
authRouter.patch("/reset-password", authController.resetPassword)
authRouter.get("/verify-reset-token/:token", authController.verifyGettoken)
authRouter.post("/current-user", authenticate, authController.currentUser)


module.exports = authRouter