import express from "express"
import { catById, createCategory, getAllCategories, deleteCat, updateCategory } from "../controllers/category.controller.js"
import { userAuth, adminauth } from "../middlewares/auth.js";

const router = express.Router()

router.route("/create").post(createCategory)
router.route("/all").get(getAllCategories)
router.route("/:id").get(catById).delete(deleteCat).patch(updateCategory)


export default router