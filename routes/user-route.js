const express = require("express")
const userController = require("../controller/user-controller")

const userRouter = express.Router()
const upload = require('../middlewares/upload')

userRouter.post("/uploadprofilepic", upload.single('avatar'), userController.uploadAvatar)

module.exports = userRouter