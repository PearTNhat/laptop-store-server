import { errorResponseHandler, invalidPathHandler } from "~/middleware/errorHandler"
import { userRoute } from "./userRoute"
import { productRoute } from "./productRoute"
import { commentRoute } from "./commentRoute"
import { productCategoryRoute } from "./productCategorRoute"
import { blogCategoryRoute } from "./blogCategorRoute"
const initRoutes = (app) => {
    app.use('/api/user', userRoute)
    app.use('/api/product', productRoute)
    app.use('/api/comment', commentRoute)
    app.use('/api/product-category', productCategoryRoute)
    app.use('/api/blog-category', blogCategoryRoute)

    app.use(invalidPathHandler)
    app.use(errorResponseHandler)
}
export default initRoutes