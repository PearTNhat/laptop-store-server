import { errorResponseHandler, invalidPathHandler } from "~/middleware/errorHandler"
import { userRoute } from "./userRoute"
import { productRoute } from "./productRoute"
import { commentRoute } from "./commentRoute"
import { brandRoute } from "./brandRoute"
import { couponRoute } from "./couponRoute"
import { dailyDealsRoute } from "./dailyDealsRoute"
import {orderRoute} from "./orderRoute"
import { seriesRoute } from "./seriesRoute"
const initRoutes = (app) => {
    app.use('/api/user', userRoute)
    app.use('/api/product', productRoute)
    app.use('/api/comment', commentRoute)
    app.use('/api/brand', brandRoute)
    app.use('/api/series', seriesRoute)
    app.use('/api/coupon', couponRoute)
    app.use('/api/daily-deals', dailyDealsRoute)
    app.use('/api/order', orderRoute)
    app.use(invalidPathHandler)
    app.use(errorResponseHandler)
}
export default initRoutes