const express = require("express")
const orderController = require('../controller/order-controller')
const orderRouter = express.Router()


orderRouter.post("/save", orderController.saveOrderCheckOut)
orderRouter.get("/getorderidlastest", orderController.GetOrderIdLastest)
orderRouter.patch("/confirmorder/:orderId", orderController.ConfirmOrder)
orderRouter.patch("/cancelorder", orderController.CancelOrder)
module.exports = orderRouter