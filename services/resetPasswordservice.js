const prisma = require('../config/prisma');


const resetPasswordservice = {}

resetPasswordservice.resetPassword = ({ email: resetemail, hashedPassword: newHashedPassword }) => {

    return prisma.user.update({
        where: {
            email: resetemail,
        },
        data: {
            password: newHashedPassword,
        },
    })
}

module.exports = resetPasswordservice;