require('dotenv').config()
const prisma = require('../config/prisma')


async function run() {
    await prisma.$executeRawUnsafe('DROP DATABASE phonecase')
    await prisma.$executeRawUnsafe('CREATE DATABASE phonecase')

}

console.log('Reset DB...')
run()