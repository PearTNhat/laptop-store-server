import express from 'express'
const app = express()
import "dotenv/config";
import cookieParser from 'cookie-parser';
import { connectDB } from './configs/mongodb';
import initRoutes from './routes';

connectDB();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
initRoutes(app);
app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})