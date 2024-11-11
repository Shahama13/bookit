import Employee from "../models/employee.model.js"
import User from "../models/user.model.js"

const generateAccessAndRefreshTokens = async (id, who) => {
    try {
        let individual
        if (who === "user") {
            individual = await User.findById(id)
        }
        if (who === "employee") {
            individual = await Employee.findById(id)
        }
        const accessToken = await individual.generateAccessToken()
        const refreshToken = await individual.generateRefreshToken()
        individual.refreshToken = refreshToken
        await individual.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        console.log("Error generating tokens", error)
    }
}

export default generateAccessAndRefreshTokens