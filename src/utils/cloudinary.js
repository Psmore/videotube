import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function(localFilePath) {
    try {
        if(!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath, {
                resource_type: "auto"
        });
        //file has been uploaded successfully
        // response is in server console 
        //console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath); //remove the file from local storage succefully uploading on cloudinary
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temporary file
        //as upload operation got failed
        console.log(error.message);
        return null;
    }
}

// deleting image fron cloudinary
const deleteFromCloudinary = async function(cloudinaryFilePath) {
    try {
        if (!cloudinaryFilePath) return null;
        const urlArray = cloudinaryFilePath.split("/");
        const Image = urlArray[urlArray.length - 1];
        const ImageName = Image.split(".")[0];
        await cloudinary.uploader.destroy(ImageName, { resource_type: "image"});
    } catch (error) {
        console.log(error);
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }

