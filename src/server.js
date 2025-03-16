import express from 'express'
const app = express()
import "dotenv/config";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './configs/mongodb';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import initRoutes from './routes';
const corsOptions = {
  origin: [process.env.BASE_URL_FRONTEND, 'http://localhost:5173'],
  credentials: true,
  optionSuccessStatus: 200,
}
const server = createServer(app);

const port = process.env.PORT || 5000;
app.use(cors(corsOptions));
connectDB();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
initRoutes(app);

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
const io = new Server(server, {
  pingTimeout: 60000,
  cors:corsOptions

});
io.on('connection', (socket) => {
  socket.on('handle-comment', () => {
    socket.broadcast.emit('receive-comment');
});
  // Khi client ngắt kết nối
  socket.on('disconnect', () => {
  });
});