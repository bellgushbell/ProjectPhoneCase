const prisma = require("../config/prisma")

const productService = {}

productService.getAllProduct = () => {
    return prisma.product.findMany()
}

productService.createProduct = ({ name, price, imageUrl, categoryId }) => {
    return prisma.product.create({
        data: { name, price, imageUrl, categoryId }
    })
}

productService.updateProduct = ({ productId, name, price, imageUrl, categoryId }) => {
    return prisma.product.update({
        where: {
            id: +productId
        },
        data: { name, price, imageUrl, categoryId }
    })
}


module.exports = productService