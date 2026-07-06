import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
// 1. Import createServer from http module
import { createServer } from 'http'; 
import router from './src/routes/AuthRoutes.routes.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

// 2. Wrap your express app inside a standard Node HTTP server
const server = createServer(app); 

app.use(cors({
    origin: allowedOrigin,
    methods: ['POST', 'GET', 'PUT', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', router);

app.use(notFoundHandler);
app.use(errorHandler);

// 3. EXPORT the wrapped 'server' alongside your app and origins
export { app, server, allowedOrigin }; 
