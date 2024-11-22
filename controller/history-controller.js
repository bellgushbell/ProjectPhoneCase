const prisma = require('../config/prisma');





exports.GetPaymentHistory = async (req, res, next) => {
    const { userId } = req.params;

    try {
        const payments = await prisma.payment.findMany({
            where: { order: { userId: +userId } }, // ค้นหาตาม userId
        });
        return res.json(payments);
    } catch (err) {
        console.error(err);
        next(err);
    }
};




exports.getOrderDetailHistory = async (req, res, next) => {
    const { orderId } = req.params;

    try {
        const orderDetails = await prisma.order.findUnique({
            where: { id: +orderId },
            include: {
                payments: true,
                shoppingCart: {
                    include: {
                        cartItems: {
                            include: {
                                product: {
                                    include: {
                                        category: true, // รวม category
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        console.log(orderDetails);
        return res.json(orderDetails);
    } catch (err) {
        console.error(err);
        next(err);
    }
};






