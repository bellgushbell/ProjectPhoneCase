const prisma = require('../config/prisma');

exports.getSalesData = async (req, res, next) => {
    try {
        const salesData = await prisma.order.groupBy({ //ไม่เอาorderที่มีสถานะเป็น 'PENDING', 'CANCELLED'                      
            by: ['createdAt'],  // จัดกลุ่มตามวันที่สร้างคำสั่งซื้อ
            where: {
                status: {
                    notIn: ['PENDING', 'CANCELLED'],// ไม่รวมสถานะเหล่านี้
                },
            },
            _sum: {
                totalPrice: true, // คำนวณยอดรวมของ totalPrice
            },
        });

        // สร้าง detailedSalesData เพื่อเก็บข้อมูลที่ละเอียดมากขึ้น
        const detailedSalesData = await Promise.all( // จะประกอบไปด้วยข้อมูลที่เป็นระเบียบและครบถ้วนมากขึ้น โดยแต่ละวัตถุในอาร์เรย์จะมี createdAt, totalPrice, และ orderIds
            salesData.map(async (item) => {
                // ดึงคำสั่งซื้อทั้งหมดที่ตรงกับวันที่และสถานะ
                const orders = await prisma.order.findMany({
                    where: {
                        createdAt: item.createdAt, // วันที่ตรงกัน
                        status: {
                            notIn: ['PENDING', 'CANCELLED'],  // ไม่รวมสถานะเหล่านี้
                        },
                    },
                    select: { id: true },// ดึงเฉพาะ id ของคำสั่งซื้อ
                });

                return {
                    createdAt: item.createdAt, // วันที่สร้างคำสั่งซื้อ
                    totalPrice: item._sum.totalPrice,// ยอดรวม
                    orderIds: orders.map(order => order.id), // เก็บ orderId
                };
            })
        );




        res.json(detailedSalesData);
    } catch (err) {
        console.error(err);
        next(err);
    }
};




exports.getBestSellingProducts = async (req, res, next) => {
    try {
        // ดึงข้อมูลสินค้าที่ขายดีที่สุดจากตาราง Cart_Item
        const bestSellingProducts = await prisma.cart_Item.groupBy({
            by: ['productId'], // จัดกลุ่มตาม productId
            _sum: {
                amount: true, // คำนวณจำนวนที่ขาย
            },
            orderBy: {
                _sum: {
                    amount: 'desc',// เรียงลำดับจากมากไปน้อย
                },
            },
            take: 10, // แสดงสินค้าที่ขายดีที่สุด 10 รายการ
        });

        // ดึงข้อมูลผลิตภัณฑ์เพื่อแสดงรายละเอียด
        const productIds = bestSellingProducts.map(item => item.productId); // เก็บ productId ของสินค้าที่ขายดีที่สุด
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds }, // ค้นหาผลิตภัณฑ์ที่มี id ตรงกับ productIds
            },
        });

        // รวมข้อมูลสินค้าพร้อมจำนวนที่ขาย
        const bestSellingProductsWithDetails = bestSellingProducts.map(item => {
            const product = products.find(p => p.id === item.productId) // หาผลิตภัณฑ์ตาม id
            return {
                id: product.id, // id ของผลิตภัณฑ์
                name: product.name, // ชื่อผลิตภัณฑ์
                price: product.price, // ราคาผลิตภัณฑ์
                amount: item._sum.amount, // จำนวนที่ขาย
            };
        });

        res.json(bestSellingProductsWithDetails);
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.getPopularPaymentMethods = async (req, res, next) => {
    try {
        // ดึงข้อมูลวิธีการชำระเงินที่ใช้บ่อยที่สุด
        const popularPaymentMethods = await prisma.payment.groupBy({
            by: ['payment_method'],
            _count: {
                payment_method: true, // นับจำนวนการใช้งานแต่ละวิธีการชำระเงิน
            },
        });
        res.json(popularPaymentMethods);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getNonCheckedOutCarts = async (req, res, next) => {
    try {
        // ดึงรายการตะกร้าสินค้าที่ยังไม่ได้เช็คเอาท์
        const nonCheckedOutCarts = await prisma.shopping_Cart.findMany({
            where: {
                isCheckout: false,
            },
            include: {
                cartItems: true, // รวมรายการสินค้าที่อยู่ในตะกร้า
                user: true, // หากต้องการข้อมูลผู้ใช้
            },
        });
        res.json(nonCheckedOutCarts);
    } catch (err) {
        console.error(err);
        next(err);
    }
};
