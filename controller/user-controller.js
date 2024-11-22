const cloudinary = require('../config/cloudinary'); // ดึงการตั้งค่า cloudinary ที่คุณทำไว้
const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');

exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id; // รับ userId จาก token หรือ session
        const haveFile = !!req.file; // ตรวจสอบว่ามีไฟล์หรือไม่
        let uploadResult = {};

        if (haveFile) {
            // อัปโหลดรูปไปที่ Cloudinary
            uploadResult = await cloudinary.uploader.upload(req.file.path, {
                overwrite: true,
                public_id: path.parse(req.file.path).name, // ใช้ชื่อไฟล์เดิม
            });

            // ลบไฟล์ที่เก็บในเครื่องออกเมื่ออัปโหลดเสร็จแล้ว
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Failed to delete local file:", err);
                } else {
                    console.log("Local file deleted successfully");
                }
            });
        }

        // อัปเดต URL รูปโปรไฟล์ลงในฐานข้อมูล
        await prisma.user.update({
            where: { id: userId }, // ใช้ userId จาก token
            data: { profileImage: uploadResult.secure_url || '' } // บันทึก secure_url จาก Cloudinary ในฟิลด์ profileImage
        });

        res.status(200).json({ message: 'Avatar uploaded successfully', avatarUrl: uploadResult.secure_url });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Error uploading avatar' });
    }
};
