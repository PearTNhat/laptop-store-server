import { errorResponseHandler, invalidPathHandler } from "~/middleware/errorHandler"
import { userRoute } from "./userRoute"
import { productRoute } from "./productRoute"
import { commentRoute } from "./commentRoute"
import { productCategoryRoute } from "./productCategoryRoute"
import { blogCategoryRoute } from "./blogCategoryRoute"
import { brandRoute } from "./brandRoute"
import { blogRoute } from "./blogRoute"
import { couponRoute } from "./couponRoute"
import { dailyDealsRoute } from "./dailyDealsRoute"
import {orderRoute} from "./orderRoute"
import { sthRoute } from "./sth"
const initRoutes = (app) => {
    app.use('/api/user', userRoute)
    app.use('/api/product', productRoute)
    app.use('/api/comment', commentRoute)
    app.use('/api/product-category', productCategoryRoute)
    app.use('/api/blog', blogRoute)
    app.use('/api/blog-category', blogCategoryRoute)
    app.use('/api/brand', brandRoute)
    app.use('/api/coupon', couponRoute)
    app.use('/api/daily-deals', dailyDealsRoute)
    app.use('/api/order', orderRoute)
    app.use('/api/sth', sthRoute)
    app.use(invalidPathHandler)
    app.use(errorResponseHandler)
}
export default initRoutes