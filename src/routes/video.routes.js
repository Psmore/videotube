import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, listSearchVideo, publishVideo, searchVideo} from "../controllers/video.controller.js";
import { varifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/upload-video").post(varifyJWT,
    upload.fields(
    [
        {name: "video", maxCount: 1},
        {name: "thumbnail", maxCount: 1}
    ]
), publishVideo);

//router.route("/search/:description").get(searchVideo);
router.route("/search/:keyword").get(listSearchVideo);
router.route("/:id").get(searchVideo);

// secure routes 
router.route("/delete/:videoId").delete(varifyJWT,deleteVideo);


export default router;