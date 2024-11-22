const express = require("express")
const adminController = require('../controller/admin-controller')
const upload = require("../middlewares/upload")
const adminRouter = express.Router()
authenticate = require('../middlewares/authenticate')


//manage Store
adminRouter.post("/create-product", upload.single('image'), adminController.adminCreateProduct)
adminRouter.patch("/edit-products/:productId", upload.single('image'), adminController.adminEditProduct)
adminRouter.get("/categories", adminController.getCategories)
adminRouter.delete("/manage-products/:productId", adminController.deleteProduct)

//manage Order
adminRouter.get("/manage-orders/", adminController.AdminGetOrder)
adminRouter.patch("/manage-orders/:orderId", adminController.AdminChangeStatusOrder)
adminRouter.delete("/manage-orders/:orderId", adminController.AdminDeleteOrder)

//manage Payment
adminRouter.get("/manage-payments/", adminController.AdminGetPayment)
adminRouter.patch("/manage-payments/:paymentId", adminController.AdminChangeStatusPayment)
adminRouter.patch("/manage-paymentsmethod/:paymentId", adminController.AdminChangePaymentMethod)
adminRouter.delete("/manage-payments/:paymentId", adminController.AdminDeletePayment)

module.exports = adminRouter