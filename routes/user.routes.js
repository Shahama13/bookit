import express from "express"
import {
    changeAvatar,
    changeCurrentPassword,
    getAccessToken,
    getCurrentUser,
    loginAdmin,
    loginUser,
    logoutUser,
    registerUser,
    resetPassword,
    sendResetPasswordMail,
    verifyUserEmail,
    addRemoveFromfavs
} from "../controllers/user.controller.js";
import { userAuth } from "../middlewares/auth.js";

const router = express.Router();

router.route("/register").post(registerUser)
router.route("/verify-email").post(verifyUserEmail)
router.route("/login").post(loginUser)
router.route("/login/admin").post(loginAdmin)
router.route("/me").get(userAuth, getCurrentUser)
router.route("/token").post(getAccessToken)
router.route("/logout").get(userAuth, logoutUser)

router.route("/forgot-password").post(sendResetPasswordMail)
router.route("/reset-password").post(resetPassword)
router.route("/change-password").post(userAuth, changeCurrentPassword)
router.route("/change-profile").post(userAuth, changeAvatar)
router.route("/favs").post(userAuth, addRemoveFromfavs)

export default router