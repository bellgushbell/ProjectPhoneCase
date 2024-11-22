const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  const categoriesData = [
    { categoryName: "iPhone" },
    { categoryName: "Samsung" },
    { categoryName: "Huawei" },
  ];

  const categories = [];
  for (const categoryData of categoriesData) {
    const category = await prisma.category.create({ data: categoryData });
    categories.push(category);
  }

  const productData = Array.from({ length: 10 }, (_, i) => ({
    name: `Product ${i + 1}`,
    price: Math.floor(Math.random() * 1000) + 100, 
    imageUrl: `https://example.com/product${i + 1}.jpg`,
    categoryId: categories[i % categories.length].id, 
  }));


  for (const product of productData) {
    await prisma.product.create({ data: product });
  }

  const usersDataList = Array.from({ length: 10 }, (_, i) => ({
    name: `User ${i + 1}`,
    username: `username${i + 1}`,
    password: "password",
    email: `user${i + 1}@mail.com`,
    phoneNumber: `096303475${i + 1}`,
    role: "ADMIN",
  }));


  for (const userData of usersDataList) {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 5),
        phoneNumber: userData.phoneNumber,
        role: userData.role,
      },
    });

   
    const cartItems = Array.from({ length: 3 }, () => ({
      productId: productData[Math.floor(Math.random() * productData.length)].id,
      amount: Math.floor(Math.random() * 5) + 1, 
    }));

    for (const item of cartItems) {
      await prisma.shopping_Cart.create({
        data: {
          userId: user.id,
          productId: item.productId,
          amount: item.amount,
        },
      });
    }

    console.log(user);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
