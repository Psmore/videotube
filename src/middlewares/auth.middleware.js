import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
//if you occure any error while varifying access token then add the dotenv module and config it
import dotenv from "dotenv";
dotenv.config();

// In the folling line instead of coding (req, res, next) we're writting (req, _, next)
// because we're not using the res in the controller so we can write _ instead of the non-using field
export const varifyJWT = asyncHandler( async function (req, _, next) {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid accessToken");
        }

        req.user = user;
        next();
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token");
    }
});