import express from 'express'
const app = express()
import "dotenv/config";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './configs/mongodb';
import initRoutes from './routes';
const corsOptions = {
  origin: [process.env.BASE_URL_FRONTEND],
  credentials: true,
  optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
connectDB();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
initRoutes(app);
app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})