import express from "express"
import { setWorkinghours, updateWorkingHours } from "../controllers/workingHours.controller.js"
import { employeeAuth } from "../middlewares/auth.js"

const router = express.Router()

router.route("/set-all").post(employeeAuth, setWorkinghours)
router.route("/:id").patch(employeeAuth, updateWorkingHours)

export default router