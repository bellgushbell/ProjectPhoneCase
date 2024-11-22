const express = require('express')
const MemberRouter = express.Router()
const MemberController = require('../controller/member-controller')


MemberRouter.get('/member', MemberController.getAllmember)
MemberRouter.patch('/member/:memberId', MemberController.UpdateRolemember)
MemberRouter.delete('/member/:memberId', MemberController.removeMember)

module.exports = MemberRouter