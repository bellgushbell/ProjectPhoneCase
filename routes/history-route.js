const express = require("express")
const HistoryController = require('../controller/history-controller')
const HistoryRouter = express.Router()


HistoryRouter.get("/getpayment/:userId", HistoryController.GetPaymentHistory)
HistoryRouter.get("/getorderdetail/:orderId", HistoryController.getOrderDetailHistory)

module.exports = HistoryRouter