import Series from '~/models/Series'

const getSeriesBrand = async (req, res,next) => {
    try {
        const  brandId  = req.params.brandId;
        if (!brandId) {
            throw new Error('Missing input');
        }
        const series = await Series.find({ brand: brandId });
        res.json({
            success: true,
            data: series,
        });
    } catch (error) {
        next(error);
    }
}
export { getSeriesBrand }