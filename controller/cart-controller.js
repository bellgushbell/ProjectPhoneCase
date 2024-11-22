const productService = require("../services/productservice")
const path = require('path')
const tryCatch = require('../utills/tryCatch')
const fs = require('fs/promises')
const createError = require('../utills/createError')
const cloudinary = require('../config/cloudinary')
const prisma = require('../config/prisma')

exports.getAllcart = async (req, res, next) => {
    try {
        const { id } = req.user;

        // ค้นหาตะกร้าสินค้าที่ยังไม่ได้ checkout
        const shoppingCart = await prisma.shopping_Cart.findFirst({
            where: {
                userId: +id,
                isCheckout: false
            },
            include: {
                cartItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!shoppingCart || shoppingCart.cartItems.length === 0) {
            return res.status(200).json({
                message: "Your cart is empty",
                cartItems: []
            });
        }

        const cartItems = shoppingCart.cartItems.map(item => ({ //สร้างข้อมูลใหม่ในอาร์เรย์
            productId: item.productId,
            name: item.product.name,
            description: item.product.description,
            imageUrl: item.product.imageUrl,
            price: item.price,
            amount: item.amount,
            totalPrice: item.price * item.amount //แทรกลงในอาร์เรย์ใหม่
        }));

        res.status(200).json({
            message: "Cart retrieved successfully", cartItems
        });

    } catch (err) {
        next(err)
    }
};

exports.AddProductInCart = async (req, res, next) => {
    try {
        const { id } = req.user; //จากauthenticate
        const { productId, amount } = req.body; //รับ amount: 1

        const findCheckout = await prisma.shopping_Cart.findFirst({ //หาในตาราง shopping_Cart ว่าuserId ตรงใหม กับ isCheckout ต้องเป็นfalse (ยังไม่ได้กดcheckout)
            where: {
                userId: +id,
                isCheckout: false
            }
        });


        let shoppingcart; //ประกาศนอกเพื่อเอาตัวแปรไปใช้if else

        if (!findCheckout) { //!findCheckout คือเพื่อตรวจสอบว่าผู้ใช้ (userId) มี shopping cart ที่ยังไม่ได้ checkout หรือไม่ (isCheckout: false)
            //หากยังไม่มีตะกร้าสินค้าสำหรับผู้ใช้(findCheckout เป็น false หรือไม่เจอค่าในฐานข้อมูล) จะทำการสร้างตะกร้าใหม่
            shoppingcart = await prisma.shopping_Cart.create({
                data: {
                    userId: +id //ถ้าไม่มีตะกร้าสินค้าที่ใช้งานอยู่ จะสร้างตะกร้าใหม่ในฐานข้อมูล 
                }
            });
        } else {
            shoppingcart = findCheckout;
        }

        const findCartItem = await prisma.cart_Item.findFirst({ //ตรวจสอบที่เพิ่มเข้าไปในตะกร้าสินค้า (cart) นั้นมีอยู่แล้วในตะกร้าสินค้าเดียวกันหรือไม่
            where: {
                shoppingCartId: shoppingcart.id,
                productId: +productId
            }
        });

        const product = await prisma.product.findUnique({ //ดึงผลิตภัณ ที่มีโปรดักไอดีตรงกัน เพราะจะเอาpriceของproductไปสร้างcart_Item
            where: {
                id: +productId
            }
        });

        if (!product) {
            throw createError(404, "Product not found");
        }
        console.log('findCartItemascascsacsc', findCartItem)
        if (findCartItem) { //ถ้าตอนกดมีสินค้าอยู่แล้ว
            await prisma.cart_Item.update({ //ให้อัพเดทamount+1
                where: {
                    id: findCartItem.id
                },
                data: {
                    amount: findCartItem.amount + amount   //+1
                }
            });
        } else { //ถ้าไม่มีcartItem
            await prisma.cart_Item.create({
                data: {
                    shoppingCartId: shoppingcart.id,
                    productId: +productId,
                    amount: +amount,
                    price: product.price
                }
            });
        }

        res.status(200).json({ message: "Product added to cart successfully!" });
    } catch (err) {
        next(err)
    }
};

exports.updateCartandQuantity = async (req, res, next) => {
    try {
        const { id } = req.user;
        const productId = req.params.productId;
        const { amount } = req.body;
        // console.log(productId, amount, id)
        const findCheckout = await prisma.shopping_Cart.findFirst({ //หาshopping_Cart ที่เป็น isCheckout: false
            where: {
                userId: +id,
                isCheckout: false
            }
        }); //ค้นหาตะกร้าสินค้าสำหรับผู้ใช้ที่ยังไม่ทำการชำระเงิน (isCheckout: false)

        if (!findCheckout) {
            return res.status(404).json({ message: "No active shopping cart found" });
        }

        const findCartItem = await prisma.cart_Item.findFirst({
            //ค้นหาสินค้าที่มี productId ภายในตะกร้าเดียวกัน (shoppingCartId)
            where: {
                shoppingCartId: findCheckout.id,
                productId: +productId
            }
        });

        if (!findCartItem) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        const newAmount = findCartItem.amount + amount; //เพิ่มหรือลดจำนวนสินค้าที่อยู่ในตะกร้าจากค่าปัจจุบันด้วยค่าที่ได้รับจาก amount ที่ผู้ใช้ส่งมา

        if (newAmount <= 0) { //หากจำนวนสินค้าน้อยกว่าหรือเท่ากับ 0
            // แทนที่จะเก็บสินค้าที่มีจำนวน 0 ไว้ในตะกร้า ซึ่งไม่มีความหมาย เราจึงลบสินค้านั้นออกจากตะกร้าเลย
            await prisma.cart_Item.delete({
                where: {
                    id: findCartItem.id
                }
            }); //ทำการลบสินค้านั้นออกจากตะกร้า
            return res.status(200).json({ message: "Item removed from cart" });
        }

        await prisma.cart_Item.update({ // หากจำนวนสินค้ายังมากกว่า 0
            where: {
                id: findCartItem.id
            },
            data: {
                amount: newAmount //อัพเดทamount
            }
        });

        res.status(200).json({ message: "Cart updated successfully" });
    } catch (err) {
        next(err);
    }
};

exports.deleteCart = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { productId } = req.params;

        const findCheckout = await prisma.shopping_Cart.findFirst({
            where: {
                userId: +id,
                isCheckout: false
            }
        });

        if (!findCheckout) {
            return res.status(404).json({ message: "No active shopping cart found" });
        }

        const findCartItem = await prisma.cart_Item.findFirst({
            where: {
                shoppingCartId: findCheckout.id,
                productId: +productId
            }
        });

        if (!findCartItem) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        await prisma.cart_Item.delete({
            where: {
                id: findCartItem.id
            }
        });

        res.status(200).json({ message: "Product removed from cart successfully" });
    } catch (err) {
        next(err);
    }
};



