const prisma = require('../config/prisma')



exports.saveOrderCheckOut = async (req, res, next) => {
    try {
        // หาตะกร้าสินค้าของผู้ใช้
        const userCart = await prisma.shopping_Cart.findFirst({
            where: {
                userId: +req.user.id,
                isCheckout: false // ตรวจสอบว่าผู้ใช้อยู่ในขั้นตอน Checkout หรือยัง
            },
            include: {
                cartItems: {
                    include: {
                        product: { // รวมข้อมูลสินค้าที่อยู่ในตะกร้าสินค้า
                            include: {
                                category: true // รวมข้อมูลหมวดหมู่สินค้าด้วย จะเอาไปแสดง
                            }
                        }
                    }
                }
            }
        });

        // ตรวจสอบว่าตะกร้าสินค้าว่างหรือไม่
        if (!userCart || userCart.cartItems.length === 0) {
            return res.status(400).json({ message: "ตะกร้าสินค้าว่าง" });
        }

        // ตรวจสอบจำนวนสินค้าในสต็อก
        for (const item of userCart.cartItems) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: {
                    stock: true,
                    name: true
                } // ดึงชื่อและสต็อกสินค้า
            });

            if (!product) {
                return res.status(400).json({
                    ok: false,
                    message: `ไม่พบสินค้าในระบบ`
                });
            }

            // ตรวจสอบว่าสินค้าในตระกร้ามากกว่าสต็อกของproductใหม
            if (item.amount > product.stock) {
                return res.status(400).json({
                    ok: false,
                    message: `สินค้า ${product.name} หมด ,มีสินค้าในตระกร้าเกินมา ${item.amount - product.stock} ชิ้น`
                });
            }
        }

        // อัปเดตสถานะตะกร้าสินค้าว่าได้ทำการ Checkout แล้ว
        const updateCart = await prisma.shopping_Cart.update({
            where: { id: userCart.id },
            data: { isCheckout: true }
        });

        // คำนวณยอดรวมของสินค้าที่สั่งซื้อ เพื่อเอาไปไว้ในorderSummary
        const totalPrice = userCart.cartItems.reduce((total, item) => {
            return total + item.price * item.amount;
        }, 0);

        // สร้างคำสั่งซื้อใหม่ (Order)
        const newOrder = await prisma.order.create({
            data: {
                userId: req.user.id,
                totalPrice: totalPrice,
                status: 'PENDING', // สถานะคำสั่งซื้อเริ่มต้น
                shoppingCartId: userCart.id // เปลี่ยนชื่อ field ให้ตรงกับสคีม่า
            }
        });

        // ส่งข้อมูล Order Summary กลับไปยังผู้ใช้ 
        const orderSummary = {
            orderId: newOrder.id,
            totalPrice: totalPrice, //จากการคำนวณ
            createdAt: newOrder.createdAt,
            updatedAt: newOrder.updatedAt,
            status: newOrder.status, // ส่งสถานะคำสั่งซื้อ
            products: userCart.cartItems.map(item => ({
                productId: item.productId,
                productName: item.product.name,
                productDescription: item.product.description,
                price: item.price,
                amount: item.amount,
                totalProductPrice: item.price * item.amount,
                imageUrl: item.product.imageUrl, //  URL รูปภาพสินค้า
                categoryId: item.product.category.id, // ดึง ID ของหมวดหมู่สินค้า
                categoryName: item.product.category.categoryName // ดึงชื่อหมวดหมู่สินค้า
            }))
        };


        return res.status(200).json({
            message: 'สั่งซื้อสำเร็จและสร้างคำสั่งซื้อเรียบร้อย',
            orderSummary: orderSummary
        });

    } catch (err) {
        console.error(err);
        next(err); // ส่งข้อผิดพลาดไปยัง middleware ถัดไป
    }
};




// ฟังก์ชันสำหรับดึง Order ID ล่าสุดของผู้ใช้
exports.GetOrderIdLastest = async (req, res, next) => {
    try {
        //  userId มาจาก token หลังจากผ่านการ authenticate
        const userId = req.user.id;

        // ค้นหาออเดอร์ล่าสุดของผู้ใช้ในฐานข้อมูล โดยใช้ findFirst
        const latestOrder = await prisma.order.findFirst({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc' // เรียงจากล่าสุดไปยังเก่าสุด
            }
        });

        // ถ้าไม่พบออเดอร์
        if (!latestOrder) {
            return res.status(404).json({ message: "No order found for this user." });
        }

        // ส่งข้อมูล orderId และข้อมูลอื่น ๆ กลับไปยังฝั่ง frontend
        return res.status(200).json({
            orderId: latestOrder.id,
            totalPrice: latestOrder.totalPrice,
            status: latestOrder.status,
            createdAt: latestOrder.createdAt
        });

    } catch (err) {
        console.error(err);
        next(err);
    }
};

// ฟังก์ชันสำหรับยืนยันคำสั่งซื้อ
exports.ConfirmOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required.' });
        }

        const orderIdInt = parseInt(orderId, 10); //เลขฐาน10 0-9
        if (isNaN(orderIdInt)) {
            return res.status(400).json({ message: 'Invalid Order ID format.' });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderIdInt },
            include: {
                shoppingCart: {
                    include: {
                        cartItems: true, // ดึงข้อมูลสินค้าที่อยู่ในตะกร้า
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // ตัดสต็อกสินค้าก่อนที่จะอัปเดตสถานะเป็น 'CONFIRMED'
        for (const item of order.shoppingCart.cartItems) { //ลูปจำนวนสินค้าในตระกร้าแต่ละอัน    // ( ลดสต็อกของสินค้า cartItems) เข้าถึงข้อมูล3ระดับ

            await prisma.product.update({
                where: { id: item.productId }, // ค้นหาสินค้าตาม productId
                data: {
                    stock: {
                        decrement: item.amount // ตัดจำนวนสินค้าในสต๊อก แต่ละรายการ //เป็นคำสั่งที่ใช้ใน Prisma ในการอัปเดตค่าในฐานข้อมูล
                    }
                }
            });
        }

        // อัปเดตสถานะคำสั่งซื้อเป็น 'CONFIRMED'
        const updatedOrder = await prisma.order.update({
            where: { id: orderIdInt },
            data: { status: 'CONFIRMED' },
        });

        res.status(200).json({
            message: 'Order confirmed successfully!',
            orderId: updatedOrder.id,
            status: updatedOrder.status
        });

    } catch (err) {
        console.error('Error confirming order:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};





// ฟังก์ชันสำหรับยกเลิกคำสั่งซื้อ

exports.CancelOrder = async (req, res, next) => {
    try {
        const { orderId } = req.body;

        // ค้นหาคำสั่งซื้อที่ตรงกับ orderId
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
            },
            include: {
                shoppingCart: {
                    include: {
                        cartItems: true, // ดึงข้อมูลสินค้าที่อยู่ในตะกร้า
                    },
                },
            },
        });

        // ตรวจสอบว่ามีคำสั่งซื้อนี้อยู่ในฐานข้อมูลหรือไม่
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // คืนสต็อกสินค้าก่อนที่จะอัปเดตสถานะเป็น "CANCELLED"
        for (const item of order.shoppingCart.cartItems) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.amount // คืนจำนวนสินค้าในสต๊อก 
                    }
                }
            });
        }

        // อัปเดตสถานะของคำสั่งซื้อเป็น "CANCELLED"
        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId,
            },
            data: {
                status: 'CANCELLED',
            },
        });

        return res.status(200).json({ message: "Order cancelled successfully.", order: updatedOrder });
    } catch (err) {
        console.error(err);
        next(err);
    }
};







