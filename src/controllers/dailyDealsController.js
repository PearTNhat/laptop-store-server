import DailyDeals from "~/models/DailyDeals";
const createDailyDeals = async (req, res,next) => {
    try {
        const {product, price} = req.body;
        if(!product || !price  ){
                throw new Error('Missing required fields');
        }
        const dailyDeal = new DailyDeals({
            product,
            price,
            startDate: new Date(Date.now()),
        });
        await dailyDeal.save();
        res.status(201).json({
            success: true,
            data: dailyDeal,
        });
    } catch (error) {
        next(error);       
    }
}
// sẻ gặp lỗi khi qua ngày mới k có sản phẩm thì nó ranđom, nhưng ngày đó thêm sản phẩm vào thì nó sẻ lấy sản phẩm đó
const getDailyDeals = async (req, res,next) => {
    try {
        const givenDate = new Date(Date.now());
        const day = givenDate.getDate();
        const month =givenDate.getMonth() +1 ;
        const year = givenDate.getFullYear();
        let dailyDeals = await DailyDeals.findOne({$expr:{
            $and:[
                {$eq:[{$dayOfMonth:'$startDate'},day]},
                {$eq:[{$month:'$startDate'},month]},
                {$eq:[{$year:'$startDate'},year]}
            ]
        }}).populate('product');
        if(!dailyDeals){
    
            const randomDeals = await DailyDeals.aggregate([{ $sample: { size: 1 } }]);
            dailyDeals =await DailyDeals.populate(randomDeals[0], { path: 'product' });
        }
        res.status(200).json({
            success: true,
            data: dailyDeals,
        });
    } catch (error) {
        next(error);
    }
}
const deleteDailyDeals = async (req, res,next) => {
    try {
        const {ddid} = req.params;
        const dailyDeal = await DailyDeals.findByIdAndDelete(ddid);
        if(!dailyDeal){
            throw new Error('Daily deal not found');
        }
        res.status(200).json({
            success: true,
            data: dailyDeal,
        });
    } catch (error) {
        next(error);
        
    }
}
export {createDailyDeals, getDailyDeals, deleteDailyDeals};