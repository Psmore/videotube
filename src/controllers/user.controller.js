import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User} from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; 

// write one controller for deleliting the old avatar or coverImage which is on Cloudinary
// we're just updating and adding new file to cloudinary and not deleting it so, make a small utility function and update the 
// controller's according to it

const generateAccessAndRefreshToken = async function (userId) {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});
        
        return { accessToken, refreshToken };
        
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token", error);
    }
};

const registerUser = asyncHandler( async function (req, res) {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body;
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    //console.log(req.files);
    //we're facing some error here so defining avatarLocalPath as a const we're deifining it with let keyword.
    let avatarLocalPath;    
    avatarLocalPath = req.files?.avatar[0].path;

    
    // here i occured error in which when i'm extracting file values from req.file it's getting undefined
    // so i used different middleware's, reconstruct the controller, cludinary util and multer middleware
    // but i'm getting error constantly 
    // while doing this i'm using the postman extension in vs code then i installed postman locally and 
    // all error get solve and known that the error was in extension.

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );

} );

const loginUser = asyncHandler( async function (req, res) {
    const { email, username, password } = req.body;
    // we're occured an error while generating token's 
    // so, what's why we're console log the req.body but we're still getting error for retriving infromation from req.body
    // so we're used json data request when we console.log the req.body and email then the they are showing {} and undefined 
    // so we've to fix that at the end of this project
    //console.log(req.body)
    //console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }
    // similar approch for this error using or 
    // if (!username || !email) {
    // throw new ApiError(400, "username or email is required")}

    const user = await User.findOne({
        $or: [{username}, {email}]
    });

    if (!user) {
        throw new ApiError(401, "user does not exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        new ApiError(401, "Invalid user credentials");
    }

   const { accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

   const options = {
    httpOnly: true,
    secure: true
   };

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
      new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
      )
   );
});

const logOutUser = asyncHandler(async function(req, res) {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the filed from the document
            }
        },
        { 
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logout Successfully"
        )
    );
});

const refreshAccessToken = asyncHandler( async function ( req, res) {
    const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized request !");
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id);

        if(!user) {
            throw new ApiError(401, "Invalid refresh Token");
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used!");
        }

        const options = {
            httpOnly: true,
            secure: true
        };

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        );

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token");
    }
});

const changeCurrentPassword = asyncHandler( async function ( req, res) {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password Changed Successfully")
    );
});

const getCurrentUser = asyncHandler(function ( req, res) {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "User fetch Successfully")
    );
});

const updateAccountDetails = asyncHandler( async function ( req, res) {
    const { fullName, email } = req.body;

    if ( !fullName || !email ) {
        throw new ApiError(400, "All fields are required !");
    } 

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json( new ApiResponse(200, user, "All details Updated Successfully."));
});

const updateUserAvatar = asyncHandler( async function (req, res) {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing !");
    }

    // deleting old image from cloudinary
    const oldAvatarUrl = req.user.avatar;
    //console.log(oldAvatarUrl);
    await deleteFromCloudinary(oldAvatarUrl).catch(e => console.log(e.message));
    //if (!oldAvatar) { 
    //    throw new ApiError(400, "Error while deleting Avatar !");
    //}
    
    // uploading new image on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading Avatar !");
    }
    
    // saving new image url in database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated Successfully !")
    );
});

const updateUserCoverImage = asyncHandler( async function (req, res) {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing !");
    }
    const oldCoverImageUrl = req.user.coverImage;
    await deleteFromCloudinary(oldCoverImageUrl).catch(e => console.log(e.message));

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);   
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image !");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated Successfully !")
    );
});

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage

};