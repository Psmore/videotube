import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
//import { User } from "../models/user.model.js" 

const publishVideo = asyncHandler( async function(req, res) {
    //getting required information
    const { description } = req.body;
    const videoUrl = req.files?.video[0].path;
    const thumbnailUrl = req.files?.thumbnail[0].path;
    if (!videoUrl && !thumbnailUrl && description) {
        throw new ApiError(400, "All fiels are required !");
    }

    // uploading on cloudinary
    const video = await uploadOnCloudinary(videoUrl);
    const thumbnail = await uploadOnCloudinary(thumbnailUrl);
    if (!video) {
        throw new ApiError(400, "Error while uploading video file !!");
    }
    if (!thumbnail) {
        throw new ApiError(400, "Error while uploading thumbnil file !!");
    }
    // creating video entry in database
    const createVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        description: description,
        duration: video.bytes,
        owner: req.user._id       // because we're going through secure routes
    });                           // there is no need to add extra quorie's to find user from database

    const uploadedVideo = await Video.findById(createVideo._id);

    if(!uploadedVideo) {
        throw new ApiError(500, "Something went while uploading video to database !");
    }
    
    // generating response  
    return res
    .status(200)
    .json(
        new ApiResponse(201, uploadedVideo, "video uploaded successfully !!")
    );

});

const listSearchVideo = asyncHandler( async function(req, res) {
    const { keyword } = req.params;
    if(!keyword) {
        throw new ApiError(400, "Enter video description");
    }

    //const searchVideo = await Video.find({description: description.toLowerCase()})
    //if (!searchVideo) {
    //    throw new ApiError(400, "Video not found !!!");
    //}

    const searchVideo = await Video.aggregate([
        {
            $match: {
                description: { $regex: keyword, $options: 'i' }
            }
        },
        {
            $sort: {
                regexMatch: -1 // this sort's the data according to the keyword match
            }
        }, // add the field name of video owner to display his username and avatar because we're seeing his id in 
        //{  
        //    $addFields: {
        //        videoOwner: "$owner",
        //        pipeline: {
        //            $lookup: {
        //                from: "users",
        //                localField: "$owner",
        //                foreignField: "_id",
        //                as: "owner"
        //            }
        //        }
        //    }
        //},
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                description: 1,
                owner: 1,
                views: 1,
                //  videoOwner: 1
            }
        }

    ]);

    //console.log(searchVideo)

    return res
    .status(200)
    .json(
        new ApiResponse(201, searchVideo, "Video fetched successfully !!!")
    )
});

const searchVideo = asyncHandler( async function(req, res) {    
    const { id } = req.params;
    if(!id) {
        throw new ApiError(400, "The video id is incorrect");
    }
    // Increasing video count as someone clicked on video
    const tmpVideo = await Video.findById(id);
    tmpVideo.views++;
    await tmpVideo.save({validateBeforeSave: false});

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(String(id))
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo",
                pipeline: [{
                    $project: {
                        username: 1,
                        avatar: 1,
                    }
                }]
            },
            
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                description: 1,
                views: 1,
                ownerInfo: 1
            }
        }
    ]);
    //console.log(video)

    return res
    .status(200)
    .json(
        new ApiResponse(201, {video}, "")
    )

});

const deleteVideo = asyncHandler( async function(req, res) {
    const { videoId } = req.params;
    const video = Video.findById(videoId);
    if(!video) {
        throw new ApiError(400, "Video not found !");
    }
    if(!req.user._id === video.owner) {
        throw new ApiError(403, "You can only delete your uploaded video's !!");
    }
    await Video.findByIdAndDelete(video._id);
    
    return res
    .status(200)
    .json(
        new ApiResponse(201, {}, "Video deleted Successfully")
    )
});

export { publishVideo, listSearchVideo, searchVideo, deleteVideo }