

const prisma = require('../config/prisma')

exports.getAllProduct = async (req, res, next) => {
    try {
        const allProducts = await prisma.product.findMany({
            include: {
                category: {
                    select: {
                        categoryName: true
                    }
                }
            }
        });

        res.status(200).json({ allproduct: allProducts })
    } catch (err) {
        next(err)
    }
}
