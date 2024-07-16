import { Router } from "express";
import { registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    updateUserAvatar,
    updateUserCoverImage,
    updateAccountDetails,
    updateCurrentPassword,
    getCurrentUser,
    deleteUser
 } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { varifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1},
        { name: 'coverImage', maxCount: 1}
    ]),
    registerUser
)

//router.post("/login", loginUser)
router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(varifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-avatar").post(varifyJWT, upload.single("avatar"),
updateUserAvatar);
router.route("/update-coverImage").post(varifyJWT, upload.single("coverImage"),
updateUserCoverImage);
router.route("/update-accountDetails").post(varifyJWT, updateAccountDetails);
router.route("/update-password").post(varifyJWT, updateCurrentPassword);
router.route("/get-currentUser").get(varifyJWT, getCurrentUser);

// deleting user
router.route("/deleteUser").post(varifyJWT, deleteUser);

export default router;