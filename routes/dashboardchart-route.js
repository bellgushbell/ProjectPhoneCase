const express = require("express")
const DashboardController = require("../controller/dashboardchart-controller")

const DashboardRouter = express.Router()


DashboardRouter.get("/sales", DashboardController.getSalesData)
DashboardRouter.get("/best-selling-products", DashboardController.getBestSellingProducts)
DashboardRouter.get("/popular-payment-methods", DashboardController.getPopularPaymentMethods)
DashboardRouter.get("/non-checked-out-carts", DashboardController.getNonCheckedOutCarts)




module.exports = DashboardRouter