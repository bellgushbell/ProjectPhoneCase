
const prisma = require("../config/prisma")


exports.getAllmember = async (req, res, next) => {
    try {
        const member = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                // firstName: true,
                // lastName: true,
                role: true,
                updatedAt: true
            }
        })
        res.status(200).json(member)
    } catch (err) {
        next(err)
    }
}

exports.UpdateRolemember = async (req, res, next) => {
    try {
        const { role } = req.body
        const { memberId } = req.params
        const member = await prisma.user.update({
            where: {
                id: +memberId
            },
            data: {
                role: role
            }
        })


        res.status(200).json({ message: "Update Success", member })
    } catch (err) {
        next(err)
    }
}
exports.removeMember = async (req, res, next) => {
    try {
        const { memberId } = req.params
        // console.log(memberId);

        const member = await prisma.user.delete({
            where: {
                id: +memberId
            }
        })

        res.status(204).json({ message: "Delete Success" })
    } catch (err) {
        next(err)
    }
}