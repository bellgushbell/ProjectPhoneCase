const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../upload-pic')),
    filename: (req, file, cb) => {
        const { id } = req.user //มาจาก authenticate
        // console.log(id)
        const fullFilename = `${id}${Date.now()}_${Math.random() * 1000}${path.extname(file.originalname)}` //ทำให้ชื่อไฟล์ไม่ซ้ำกัน //path.extคือนามสกุล
        cb(null, fullFilename)
    }
})


module.exports = multer({ storage: storage })