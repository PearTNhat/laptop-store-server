import {sign} from 'jsonwebtoken';
const generateAccessToken = ({_id,role}) => {
    return sign({ _id ,role }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
}
const generateRefreshToken = (_id) => {
    return sign({ _id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}
export { generateAccessToken,generateRefreshToken };