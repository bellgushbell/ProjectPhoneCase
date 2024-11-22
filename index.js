require('dotenv').config()
const express = require('express');
const cors = require('cors');
const handleError = require('./middlewares/error');
const notFoundHandler = require('./middlewares/not-found');
const productRoutes = require('./routes/product-route');
const authRoutes = require('./routes/auth-route');
const cartRoutes = require('./routes/cart-route')
const adminRoutes = require('./routes/admin-route')
const app = express();
const authenticate = require('./middlewares/authenticate')
const orderRoutes = require('./routes/order-route')
const MemberRoutes = require('./routes/member-route')
const PaymentRoutes = require('./routes/payment-route')
const HistoryRoutes = require('./routes/history-route')
const UserRoutes = require('./routes/user-route')
const DashboardChartRoutes = require('./routes/dashboardchart-route')

app.use(cors())
app.use(express.json())

app.use("/auth", authRoutes)
app.use("/product", productRoutes)
app.use("/cart", authenticate, cartRoutes)
app.use("/admin", authenticate, adminRoutes)
app.use("/order", authenticate, orderRoutes)
app.use("/member", authenticate, MemberRoutes)
app.use("/payment", authenticate, PaymentRoutes)
app.use("/history", authenticate, HistoryRoutes)
app.use("/user", authenticate, UserRoutes)
app.use("/dashboard", authenticate, DashboardChartRoutes)

app.use(handleError)
app.use("*", notFoundHandler)


app.listen(8001, () => console.log("server is running port 8001"))