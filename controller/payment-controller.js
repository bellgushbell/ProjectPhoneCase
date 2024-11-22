const cloudinary = require('../config/cloudinary'); // นำเข้า Cloudinary config
const fs = require('fs');
const getPublicId = require('../config/getPublicId'); // ฟังก์ชันในการดึง public_id จาก URL
const prisma = require('../config/prisma'); // นำเข้า Prisma Client
const path = require('path');

exports.createPayment = async (req, res, next) => {
    try {
        const orderId = +req.params.orderId;  // แปลงเป็นตัวเลข

        if (!orderId) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        // console.log(req.body);  // ดูข้อมูลที่ส่งมาจากฟอร์ม
        // console.log("Order ID:", orderId);
        // console.log("Payment Method:", req.body.paymentMethod);
        // console.log("Uploaded Slip:", req.file);


        const haveFile = !!req.file;  // ตรวจสอบว่าอัปโหลดไฟล์มาหรือไม่
        let uploadResult = {};
        // console.log('havefileascascascsac', haveFile);

        if (haveFile) {
            // อัปโหลดไฟล์ไปยัง Cloudinary
            uploadResult = await cloudinary.uploader.upload(req.file.path, {
                overwrite: true, //หากมีไฟล์ที่มี public_id เดียวกันอยู่ใน Cloudinary แล้วให้ทำการเขียนทับไฟล์เดิม
                public_id: path.parse(req.file.path).name, //ดึงชื่อของไฟล์
            });

            // ลบไฟล์จากโฟลเดอร์หลังจากอัปโหลดเสร็จ
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Failed to delete local file:", err);
                } else {
                    console.log("Local file deleted successfully");
                }
            });
        }

        // ตรวจสอบว่า orderId ที่ส่งมาใน URL มีอยู่ในฐานข้อมูลหรือไม่
        const orderExists = await prisma.order.findFirst({
            where: {
                id: orderId
            }
        });
        // console.log("Order exists:", orderExists);

        // console.log("Order exists for ID:", orderId);
        // console.log("orderExistsasdsacsacsacascsaccascsa----------", orderExists)

        if (!orderExists) {
            const errorMessage = `Order with ID ${orderId} not found.`;
            console.error(errorMessage);
            return res.status(404).json({ message: errorMessage });
        }

        // สร้าง payment ใหม่ในฐานข้อมูล
        const data = {
            orderId,
            payment_method: req.body.paymentMethod,
            imgPayment: uploadResult.secure_url || '',  // ใช้ URL ที่ได้จาก Cloudinary
            status: 'PENDING',  // สถานะเริ่มต้น
        };

        const payment = await prisma.payment.create({
            data
        });
        // console.log('dataascascsacsacasc', payment)

        const responseData = {
            ...payment,
            orderId: orderExists.id
        };

        // ส่งผลลัพธ์กลับไปยัง frontend
        res.status(200).json({ message: "Payment created successfully", responseData });
    } catch (err) {
        console.error("Error in createPayment:", err);
        next(err);
    }
};


exports.getPaymentByorderIdAndPaymentId = async (req, res, next) => {
    try {
        const { orderId, paymentId } = req.params;
        console.log(`Order ID: ${orderId}, Payment ID: ${paymentId}`); // log parameters

        const payment = await prisma.payment.findFirst({
            where: {
                orderId: +orderId,
                id: +paymentId
            },
            include: {
                order: true,
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(200).json(payment);
    } catch (err) {
        console.error(err); // log error
        next(err);
    }
};



