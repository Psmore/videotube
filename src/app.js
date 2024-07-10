import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//import bodyParser from "body-parser"
const app = express();

app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: true, limit: "50mb"}));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
//app.use(bodyParser())
app.use(express.static("public"));
app.use(cookieParser());
// importing routes
import userRoutes from "./routes/user.routes.js";
// defining routes
app.use("/api/v1/users", userRoutes);
export { app }