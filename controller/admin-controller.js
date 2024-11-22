const cloudinary = require('../config/cloudinary');
const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');
const tryCatch = require('../utills/tryCatch');

exports.adminCreateProduct = async (req, res, next) => {
    try {

        // ประกาศตัวแปรจาก req.body
        const { name, price, categoryId, description, stock } = req.body;
        // console.log(req.body);

        const haveFile = !!req.file; // check ว่ามีไฟล์หรือไม่ boolean
        let uploadResult = {};

        if (haveFile) { // true
            uploadResult = await cloudinary.uploader.upload(req.file.path, {
                overwrite: true,
                public_id: path.parse(req.file.path).name, //ดึงชื่อไฟล์(ไม่รวม .ext) จาก req.file.path
            });

            fs.unlink(req.file.path, (err) => { // floder upload-pic
                if (err) {
                    console.error("Failed to delete local file:", err);
                } else {
                    console.log("Local file deleted successfully");
                }
            });
        }

        // ตรวจสอบว่า categoryId ที่ส่งมามีอยู่ในฐานข้อมูลหรือไม่ 
        const categoryExists = await prisma.category.findUnique({
            where: { id: +categoryId }
        });

        if (!categoryExists) {
            const errorMessage = `Category with ID ${categoryId} not found Pls Insert Category In DB.`;
            console.error(errorMessage);
            return res.status(400).json({ message: errorMessage });
        }

        const data = {
            name: name,
            imageUrl: uploadResult.secure_url || '',
            price: +price,
            categoryId: +categoryId,
            description: description,
            stock: +stock,
        };

        const rs = await prisma.product.create({
            data
        });

        const responseData = {
            ...rs,
            categoryName: categoryExists.categoryName
        };

        res.status(200).json({ message: "Create Product success", responseData });
    } catch (err) {
        console.error("Error in adminCreateProduct:", err);
        next(err);
    }
};

exports.getCategories = async (req, res, next) => {
    try {
        // ดึงข้อมูลหมวดหมู่ทั้งหมดจากฐานข้อมูล
        const categories = await prisma.category.findMany();

        // ส่งข้อมูลหมวดหมู่กลับไปยัง client
        res.status(200).json(categories);
    } catch (err) {
        console.error("Error fetching categories:", err);
        next(err);
    }
};




exports.adminEditProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { name, price, categoryId, description, stock, imageUrl } = req.body; // Destructuring req.body
        const haveFile = !!req.file; // ตรวจสอบว่ามีไฟล์ที่ส่งมาหรือไม่

        let uploadResult;

        if (haveFile) {

            uploadResult = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "auto",
                overwrite: true
            });
        }

        // ตรวจสอบ categoryId
        const categoryExists = await prisma.category.findUnique({
            where: { id: +categoryId },
        });

        if (!categoryExists) { // ถ้าไม่พบหมวดหมู่ (categoryExists === null)
            return res.status(400).json({ message: `Category with ID ${categoryId} not found` });
        }

        // ตั้งค่าข้อมูล
        const data = {
            name: name,
            price: +price,
            categoryId: +categoryId,
            description: description,
            stock: +stock,
            imageUrl: haveFile ? uploadResult.secure_url : imageUrl, //havefile boolean
        };

        // อัปเดตผลิตภัณฑ์
        const updatedProduct = await prisma.product.update({
            where: { id: +productId },
            data,
        });

        // ลบไฟล์ที่เก็บไว้ใน temp file หลังจากอัปโหลดไปยัง Cloudinary
        if (haveFile) {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                }
            });
        }

        res.status(200).json({ message: "Product updated successfully", responseData: updatedProduct });
    } catch (err) {
        console.error("Error in adminEditProduct:", err);
        next(err);
    }
};


module.exports.deleteProduct = tryCatch(async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await prisma.product.findUnique({
            where: {
                id: +productId
            }
        });

        if (!product) {
            return res.status(404).json("Not Found ProductId");
        }

        await prisma.product.delete({
            where: {
                id: +productId
            }
        });

        res.status(200).json("Delete Successful");
    } catch (err) {
        next(err);
    }
});



module.exports.AdminGetOrder = tryCatch(async (req, res, next) => {
    try {
        // ดึงข้อมูลออเดอร์พร้อม relation ของ shoppingCart, user, cartItems และ product
        const orders = await prisma.order.findMany({
            include: {
                shoppingCart: {
                    include: {
                        user: true, // ดึงข้อมูล user ที่เกี่ยวข้อง
                        cartItems: {
                            include: {
                                product: true // ดึงข้อมูล product ที่เกี่ยวข้อง
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({ orders });
    } catch (err) {
        next(err);
    }
});





module.exports.AdminChangeStatusOrder = tryCatch(async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // ดึงข้อมูลคำสั่งซื้อพร้อมตะกร้าและสินค้าที่อยู่ในตะกร้า
        const order = await prisma.order.findFirst({
            where: {
                id: +orderId,
            },
            include: {
                shoppingCart: {
                    include: {
                        cartItems: true, // ดึงข้อมูลสินค้าที่อยู่ในตะกร้า
                    },
                },
            },
        });

        // ถ้าสถานะเป็น CANCELLED ทำการคืนสต็อก
        if (status === "CANCELLED") {
            for (const item of order.shoppingCart.cartItems) {
                if (item.amount > 0) { // ใช้ item.amount แทน item.quantity
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.amount, // คืนค่าจำนวนที่ถูกหักจากสต็อก ฟังก์ชันที่ Prisma (ORM)
                            },
                        },
                    });
                }
            }
        }

        if (status === "CONFIRMED") {
            for (const item of order.shoppingCart.cartItems) { //ข้อมูลรายการสินค้าที่ถูกสั่งซื้อ
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    return res.status(404).json({
                        message: `Product with ID ${item.productId} not found.`,
                    });
                }

                if (product.stock < item.amount) { //ถ้าจำนวนสินค้าที่สั่ง (item.amount) มากกว่าจำนวนสต็อกที่มีอยู่ในฐานข้อมูล
                    return res.status(400).json({
                        message: `Product ${product.name} stock is not enough.`,
                    });
                }

                if (item.amount > 0) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                decrement: item.amount, // หักจำนวนจากสต็อก 
                            },
                        },
                    });
                }
            }
        }





        // อัพเดทสถานะในตาราง Order
        const updatedOrder = await prisma.order.update({
            where: {
                id: +orderId
            },
            data: {
                status: status
            }
        });

        res.status(200).json({
            message: "ChangeStatus Successful",
            updatedOrder
        });
    } catch (err) {
        next(err);
    }
});









module.exports.AdminDeleteOrder = tryCatch(async (req, res, next) => {
    try {
        const { orderId } = req.params;


        await prisma.order.delete({
            where: {
                id: +orderId
            }
        });

        res.status(200).json({
            message: "Delete Successful"
        });
    } catch (err) {
        next(err);
    }
});






module.exports.AdminGetPayment = tryCatch(async (req, res, next) => {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                order: {
                    include: {
                        shoppingCart: {
                            include: {
                                user: true // ดึงข้อมูลผู้ใช้ที่เกี่ยวข้อง
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({ payments });
    } catch (err) {
        next(err);
    }
});

module.exports.AdminChangeStatusPayment = tryCatch(async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const { status } = req.body;


        const updatedPayment = await prisma.payment.update({
            where: { id: +paymentId },
            data: { status }
        });

        res.status(200).json({ message: "Payment status updated successfully", updatedPayment });
    } catch (err) {
        next(err);
    }
});

module.exports.AdminChangePaymentMethod = tryCatch(async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const { payment_method } = req.body;


        const updatedPayment = await prisma.payment.update({
            where: { id: +paymentId },
            data: { payment_method }
        });

        res.status(200).json({ message: "Payment method updated successfully", updatedPayment });
    } catch (err) {
        next(err);
    }
});

module.exports.AdminDeletePayment = tryCatch(async (req, res, next) => {
    try {
        const { paymentId } = req.params;


        await prisma.payment.delete({
            where: { id: +paymentId }
        });

        res.status(200).json({ message: "Delete Successful" });
    } catch (err) {
        next(err);
    }
});










