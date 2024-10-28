import jwt from "jsonwebtoken";
const verifyAccessToken = (req, res, next) => {
  console.log(req.headers.authorization)
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer")
    ) {
      throw new Error("Missing token");
    }
    const accessToken = req.headers.authorization.split(" ")[1];
    const decode = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    // if(error instanceof jwt.JsonWebTokenError){
    //     throw new Error("token expired");
    // }
    next(error);
  }
};
const isAdmin = (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new Error("You are not admin");
    }
    next();
  } catch (error) {
    next(error);
  }
};
export { verifyAccessToken, isAdmin };