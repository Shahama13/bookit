import express from "express"
import { getWorkinghours, setWorkinghours, updateWorkingHours } from "../controllers/workinghours.controller.js"
import { employeeAuth } from "../middlewares/auth.js"

const router = express.Router()

router.route("/set-all").post(employeeAuth, setWorkinghours)
router.route("/emp/:id").get(getWorkinghours)
router.route("/:id").patch( updateWorkingHours)

export default router