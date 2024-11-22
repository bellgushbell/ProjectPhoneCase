const express = require("express")
const cartController = require("../controller/cart-controller")

const cartRouter = express.Router()




cartRouter.get("/", cartController.getAllcart)
cartRouter.post("/", cartController.AddProductInCart)
cartRouter.patch("/:productId", cartController.updateCartandQuantity)



cartRouter.delete("/:productId", cartController.deleteCart)


module.exports = cartRouter