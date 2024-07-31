import { errorResponseHandler, invalidPathHandler } from "~/middleware/errorHandler"
import { userRoute } from "./userRoute"
import { productRoute } from "./productRoute"
import { commentRoute } from "./commentRoute"
import { productCategoryRoute } from "./productCategoryRoute"
import { blogCategoryRoute } from "./blogCategoryRoute"
import { brandRoute } from "./brandRoute"
import { blogRoute } from "./blogRoute"
import { couponRoute } from "./couponRoute"
const initRoutes = (app) => {
    app.use('/api/user', userRoute)
    app.use('/api/product', productRoute)
    app.use('/api/comment', commentRoute)
    app.use('/api/product-category', productCategoryRoute)
    app.use('/api/blog', blogRoute)
    app.use('/api/blog-category', blogCategoryRoute)
    app.use('/api/brand', brandRoute)
    app.use('/api/coupon', couponRoute)
    app.use(invalidPathHandler)
    app.use(errorResponseHandler)
}
export default initRoutes