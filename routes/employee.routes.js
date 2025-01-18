import express from "express"
import { adminauth, employeeAuth, userAuth } from "../middlewares/auth.js";
import {
    changeAvatar,
    changeCurrentPassword,
    deleteEmployee,
    empById,
    getAccessToken,
    getAllEmployees,
    getCurrentEmployee,
    loginEmployee,
    logoutEmployee,
    registerEmployee,
    resetPassword,
    sendResetPasswordMail,
    verifyEmployeeEmail,
    updateEmployee
} from "../controllers/employee.controller.js";

const router = express.Router()

router.route("/register").post(userAuth, adminauth, registerEmployee)

router.route("/verify-email").post(verifyEmployeeEmail)
router.route("/login").post(loginEmployee)
router.route("/me").get(employeeAuth, getCurrentEmployee)
router.route("/token").post(getAccessToken)
router.route("/logout").get(employeeAuth, logoutEmployee)

router.route("/forgot-password").post(sendResetPasswordMail)
router.route("/reset-password").post(resetPassword)
router.route("/change-password").post(employeeAuth, changeCurrentPassword)
router.route("/change-profile").post(employeeAuth, changeAvatar)

router.route("/all").get(getAllEmployees)
router.route("/:id").get(empById).delete(userAuth, adminauth, deleteEmployee).patch(userAuth, adminauth, updateEmployee)

export default router