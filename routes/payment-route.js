const express = require("express")
const PaymentController = require('../controller/payment-controller')
const upload = require('../middlewares/upload');
const PaymentRouter = express.Router()

PaymentRouter.post("/order/:orderId/payment", upload.single('slip'), PaymentController.createPayment);

PaymentRouter.get("/order/:orderId/payment/:paymentId", PaymentController.getPaymentByorderIdAndPaymentId);


module.exports = PaymentRouter