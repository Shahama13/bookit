import catchAsyncError from "../utils/catchAsyncError.js"
import Employee from "../models/employee.model.js"
import Appointment from "../models/appointment.model.js"
import Category from "../models/category.model.js"
import ErrorHandler from "../utils/ErrorHandler.js"
import Workinghours from "../models/workinghours.model.js"
import ApiResponse from "../utils/ApiResponse.js"

const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function updateDateToToday(dateString) {
    let originalDate = new Date(dateString);
    let today = new Date(); // Get today's date

    // Update the date part, keeping the time part the same
    originalDate.setUTCFullYear(today.getUTCFullYear());
    originalDate.setUTCMonth(today.getUTCMonth());
    originalDate.setUTCDate(today.getUTCDate());

    return new Date(originalDate)
}

function getLocalTimeInISTFormat() {
    const currentDate = new Date();

    // Create an options object for formatting
    const options = {
        timeZone: 'Asia/Kolkata', // IST time zone
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: false // Use 24-hour format
    };

    // Format the date using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-IN', options);
    const parts = formatter.formatToParts(currentDate);

    // Extract the formatted components
    const year = parts.find(part => part.type === 'year').value;
    const month = parts.find(part => part.type === 'month').value;
    const day = parts.find(part => part.type === 'day').value;
    const hour = parts.find(part => part.type === 'hour').value;
    const minute = parts.find(part => part.type === 'minute').value;
    const second = parts.find(part => part.type === 'second').value;

    // Construct the final formatted string
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000`;
}

export const bookAppointment = catchAsyncError(async (req, res, next) => {
    const { employee, apptFor, startTime } = req.body
    // console.log(startTime)

    const category = await Category.findById(apptFor)
    const date = new Date(startTime);
    const dayNumber = date.getUTCDay();

    const dayName = daysOfWeek[dayNumber];


    // const dayHour = date.getHours();
    // const dayMins = date.getMinutes();
    // const formattedTime = `${dayHour.toString().padStart(2, '0')}:${dayMins.toString().padStart(2, '0')}`;
    // return console.log("Extracted Time:", formattedTime);


    // Add 20 minutes
    date.setUTCMinutes(date.getUTCMinutes() + category.durationInminutes);
    const endTime = date.toISOString();
    console.log("endTime", endTime)

    const bookedApptOf = await Employee.findById(employee)
    // if (!bookedApptOf.speciality.includes(apptFor)) return next(new ErrorHandler(`${bookedApptOf.fullname} doesn't offer this service`, 402))

    const workingHours = await Workinghours.findOne({ employee })
    console.log(workingHours[dayName], dayName)
    if (!workingHours) return next(new ErrorHandler(`${bookedApptOf.fullname} isn't available currently`, 402))
    if (workingHours[dayName].open === false) return next(new ErrorHandler(`${bookedApptOf.fullname} isn't available on ${dayName}`, 400))


    const workingStartDateTime = new Date(workingHours[dayName].start);
    const workingEndDateTime = new Date(workingHours[dayName].end);

    const workingHourStartTimeInSecs = workingStartDateTime.getUTCHours() * 3600 + workingStartDateTime.getUTCMinutes() * 60 + workingStartDateTime.getUTCSeconds();
    const workingHourEndTimeInSecs = workingEndDateTime.getUTCHours() * 3600 + workingEndDateTime.getUTCMinutes() * 60 + workingEndDateTime.getUTCSeconds();

    const startTimeInSecs = new Date(startTime).getUTCHours() * 3600 + new Date(startTime).getUTCMinutes() * 60 + new Date(startTime).getUTCSeconds();
    const endTimeInSecs = new Date(endTime).getUTCHours() * 3600 + new Date(endTime).getUTCMinutes() * 60 + new Date(endTime).getUTCSeconds();

    // console.log("the day is", dayName)
    console.log(startTime, workingStartDateTime)
    console.log(endTime, workingEndDateTime)

    // console.log(startTimeInSecs , workingHourStartTimeInSecs)
    // console.log(endTimeInSecs , workingHourEndTimeInSecs)

    if (startTimeInSecs < workingHourStartTimeInSecs || endTimeInSecs > workingHourEndTimeInSecs) {
        // if (endTimeInSecs > workingHourEndTimeInSecs && endTimeInSecs - workingHourEndTimeInSecs <= 600) {
        //     console.log("Appointment will be created")
        // }
        // else {
        return next(new ErrorHandler("Appointment cannot be booked outside working hours", 400))
        // }
    }

    // console.log(startTime)

    const startTimeAtMid = new Date(startTime);
    startTimeAtMid.setUTCHours(0, 0, 0, 0);

    // End of the day (23:59:59)
    const endTimeAtMid = new Date(startTimeAtMid);
    endTimeAtMid.setUTCHours(23, 59, 59, 999);


    // console.log(`Start of the day: ${startTimeAtMid.toISOString()}`);
    // console.log(`End of the day: ${endTimeAtMid.toISOString()}`);
    // console.log(startTime)

    // jut find only those appts which are booked and are of that day 

    const appt = await Appointment.find({
        employee,
        status: "Booked",
        startTime: {
            $gte: startTimeAtMid,
            $lt: endTimeAtMid
        }
    });

    console.log(appt)

    if (appt.length >= 1) {
        // const FoundApptStartTime = new Date(appt.startTime).getUTCHours() * 3600 + new Date(appt.startTime).getUTCMinutes() * 60 + new Date(appt.startTime).getUTCSeconds();
        // const FoundApptEndTime = new Date(appt.endTime).getUTCHours() * 3600 + new Date(appt.endTime).getUTCMinutes() * 60 + new Date(appt.endTime).getUTCSeconds();
        // console.log(FoundApptStartTime, startTimeInSecs)
        // console.log(FoundApptEndTime, endTimeInSecs)
        console.log("you;ve got apppotments")

        for (let i = 0; i < appt.length; i++) {
            if (new Date(appt[i].startTime).getTime() < new Date(endTime).getTime() && new Date(appt[i].endTime).getTime() > new Date(endTime).getTime() && new Date(appt[i].startTime).getTime() > new Date(startTime).getTime() && new Date(appt[i].endTime).getTime() > new Date(startTime).getTime())
                return next(new ErrorHandler("This time slot is occupied cond 2", 400))

            if (new Date(appt[i].startTime).getTime() < new Date(startTime).getTime() && new Date(appt[i].endTime).getTime() > new Date(startTime).getTime() && new Date(appt[i].endTime).getTime() < new Date(endTime).getTime() && new Date(appt[i].startTime).getTime() < new Date(endTime).getTime())
                return next(new ErrorHandler("This time slot is occupied cond 1", 400))

            if (new Date(appt[i].startTime).getTime() <= new Date(startTime).getTime() && new Date(appt[i].endTime).getTime() >= new Date(startTime).getTime() && new Date(appt[i].startTime).getTime() <= new Date(endTime).getTime() && new Date(appt[i].endTime).getTime() >= new Date(endTime).getTime())
                return next(new ErrorHandler("This time slot is occupied cond 3", 400))

            if (new Date(appt[i].startTime).getTime() == new Date(startTime).getTime() && new Date(appt[i].endTime).getTime() > new Date(startTime).getTime() && new Date(appt[i].startTime).getTime() < new Date(endTime).getTime() && new Date(appt[i].endTime).getTime() < new Date(endTime).getTime())
                return next(new ErrorHandler("This time slot is occupied cond 4", 400))

            if (new Date(appt[i].startTime).getTime() > new Date(startTime).getTime() && new Date(appt[i].endTime).getTime() > new Date(startTime).getTime() && new Date(appt[i].startTime).getTime() < new Date(endTime).getTime() && new Date(appt[i].endTime).getTime() == new Date(endTime).getTime())
                return next(new ErrorHandler("This time slot is occupied cond 5", 400))

            if (new Date(appt[i].startTime).getTime() > new Date(startTime).getTime() && new Date(appt[i].endTime).getTime() > new Date(startTime).getTime() && new Date(appt[i].startTime).getTime() < new Date(endTime).getTime() && new Date(appt[i].endTime).getTime() < new Date(endTime).getTime())
                return next(new ErrorHandler("This time slot is occupied cond 6", 400))
        } 8

    }

    const appointment = await Appointment.create({
        bookedBy: req.user._id,
        employee,
        apptFor,
        startTime,
        endTime,
    })

    return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked "))
})

export const getTimeSlot = catchAsyncError(async (req, res, next) => {
    const { employee, apptFor, date } = req.body

    const category = await Category.findById(apptFor)
    const apptDate = new Date(date)
    const dayNumber = apptDate.getUTCDay();
    const dayName = daysOfWeek[dayNumber];

    console.log(dayName)

    const workingHours = await Workinghours.findOne({ employee })
    if (workingHours[dayName].open === false) return next(new ErrorHandler(`Stylist not available on ${dayName}`, 400))

    const startTimeAtMid = new Date(date);
    startTimeAtMid.setUTCHours(0, 0, 0, 0);

    // End of the day (23:59:59)
    const endTimeAtMid = new Date(startTimeAtMid);
    endTimeAtMid.setUTCHours(23, 59, 59, 999);

    const appt = await Appointment.find({
        employee,
        status: "Booked",
        startTime: {
            $gte: startTimeAtMid,
            $lt: endTimeAtMid
        }
    });
    appt?.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // console.log(appt)
    let intervals = []

    const startTime = updateDateToToday(workingHours[dayName].start)
    const endTime = updateDateToToday(workingHours[dayName].end)

    if (!appt) {

        intervals.push(startTime.toISOString())
        while (startTime < endTime) {
            startTime.setUTCMinutes(startTime.getUTCMinutes() + category.durationInminutes)
            const time = startTime.toISOString()
            if (new Date(time) < endTime) {
                intervals.push(time)
            }
        }
        console.log(intervals)

    }

    else {
        let newStart
        let newEnd
        for (let i = 0; i <= appt.length; i++) {
            console.log(i)
            if (i === 0) {
                newStart = updateDateToToday(startTime)
            } else {
                newStart = updateDateToToday(appt[i - 1].endTime)
            }

            if (i === appt.length) {
                newEnd = updateDateToToday(endTime)
            }
            else {
                newEnd = updateDateToToday(appt[i].startTime)
            }

            console.log(newStart, newEnd)

            const startDate = new Date(newStart)

            if (new Date(startDate.setUTCMinutes(startDate.getUTCMinutes() + category.durationInminutes)).getTime() <= newEnd.getTime()) {
                intervals.push(newStart.toISOString())
            }


            while (newStart < newEnd) {
                newStart.setUTCMinutes(newStart.getUTCMinutes() + category.durationInminutes)
                const time = newStart.toISOString()
                const newDate = new Date(time)
                if (new Date(time) < newEnd && new Date(newDate.setUTCMinutes(newDate.getUTCMinutes() + category.durationInminutes)).getTime() <= newEnd.getTime()) {
                    intervals.push(time)
                }
            }

        }
    }
    // if (date.split('T')[0] === new Date(Date.now()).toISOString().split('T')[0]) {

    //     // const localTimeInIST = getLocalTimeInISTFormat();

    //     // console.log(localTimeInIST, intervals[0], new Date(Date.now()).toISOString())

    //     intervals = intervals.filter((i) => i > new Date(Date.now()).toISOString())
    // }

    // console.log(intervals)


    if (intervals.length === 0) return next(new ErrorHandler("No slots available", 400))

    // const slots = {
    //     morning: [],
    //     afternoon: [],
    //     evening: [],
    //     night: []
    // };

    // intervals.forEach((utcDateString) => {
    //     const date = new Date(utcDateString);
    //     const localHour = date.getHours(); // getHours() gives local time in the user's time zone

    //     if (localHour >= 3 && localHour < 12) {
    //         slots.morning.push(utcDateString);
    //     } else if (localHour >= 12 && localHour < 16) {
    //         slots.afternoon.push(utcDateString);
    //     } else if (localHour >= 16 && localHour < 18) {
    //         slots.evening.push(utcDateString);
    //     } else if (localHour >= 18 && localHour <= 23) {
    //         slots.night.push(utcDateString);
    //     }
    // });

    return res.status(200).json(new ApiResponse(200, intervals ? { intervals, noOfSlots: intervals.length } : {}, intervals ? "" : "No timeslots available"))

})

export const getEmployeeApptsOfEveryInternal = catchAsyncError(async (req, res, next) => {

    const { empId } = req.params

    const startTimeAtMid = new Date(Date.now());
    startTimeAtMid.setUTCHours(0, 0, 0, 0);

    const endTimeAtMid = new Date(Date.now());
    endTimeAtMid.setUTCHours(23, 59, 59, 999);

    // Start and end of the week
    const startOfWeek = new Date(startTimeAtMid);
    startOfWeek.setUTCDate(startTimeAtMid.getUTCDate() - startTimeAtMid.getUTCDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    // Start and end of the month
    const startOfMonth = new Date(startTimeAtMid);
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setUTCMonth(startOfMonth.getUTCMonth() + 1);
    endOfMonth.setUTCDate(0); // Last day of the previous month
    endOfMonth.setUTCHours(23, 59, 59, 999);

    // Start and end of the year
    const startOfYear = new Date(startTimeAtMid);
    startOfYear.setUTCMonth(0, 1); // January 1st
    startOfYear.setUTCHours(0, 0, 0, 0);

    const endOfYear = new Date(startOfYear);
    endOfYear.setUTCMonth(11, 31); // December 31st
    endOfYear.setUTCHours(23, 59, 59, 999);

    // Fetching appointments
    const apptToday = await Appointment.find({
        employee: empId,
        startTime: {
            $gte: startTimeAtMid,
            $lt: endTimeAtMid
        }
    }).populate(['review', 'bookedBy', 'employee', 'apptFor']);

    const apptWeek = await Appointment.find({
        employee: empId,
        startTime: {
            $gte: startOfWeek,
            $lt: endOfWeek
        }
    }).populate(['review', 'bookedBy', 'employee', 'apptFor']);

    const apptMonth = await Appointment.find({
        employee: empId,
        startTime: {
            $gte: startOfMonth,
            $lt: endOfMonth
        }
    }).populate(['review', 'bookedBy', 'employee', 'apptFor']);

    const apptYear = await Appointment.find({
        employee: empId,
        startTime: {
            $gte: startOfYear,
            $lt: endOfYear
        }
    }).populate(['review', 'bookedBy', 'employee', 'apptFor']);

    const apptAll = await Appointment.find({
        employee: empId,
    }).populate(['review', 'bookedBy', 'employee', 'apptFor']);

    // Sorting
    apptToday.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    apptWeek.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    apptMonth.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    apptYear.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    apptAll.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Response
    return res.status(201).json(new ApiResponse(201, {
        today: apptToday,
        week: apptWeek.reverse(),
        month: apptMonth.reverse(),
        year: apptYear.reverse(),
        all: apptAll.reverse(),
    }, " "));

})

export const cancelAppointment = catchAsyncError(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id)
    if (!appointment) return next(new ErrorHandler("Appointment not found", 404))

    // if (new Date(appointment.startTime).getUTCHours() - new Date(Date.now()).getUTCHours() < 2)
    //     return next(new ErrorHandler("Cannot be cancelled 1 hr before", 500))

    if (appointment.status !== "Booked") return next(new ErrorHandler("Completed or cancelled appointmnets can't be deleted", 500))
    if (appointment.review) return next(new ErrorHandler("Completed or cancelled appointmnets can't be deleted", 500))

    await Appointment.findByIdAndDelete(req.params.id)
    res.status(200).json(new ApiResponse(200, {}, "Appointment cancelled"))
})

export const getUserApptHistory = catchAsyncError(async (req, res, next) => {
    const appointments = await Appointment.find({ bookedBy: req.user._id }).populate([
        { path: "bookedBy", select: "avatar fullname" },
        { path: "employee", select: "avatar fullname" },
        { path: "apptFor", select: "name special" }
    ]);
    return res.status(200).json(new ApiResponse(200, appointments?.reverse(), ""))
})

export const apptById = catchAsyncError(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id).populate(['review', 'bookedBy', 'employee', 'apptFor'])
    if (!appointment) return next(new ErrorHandler("Appointment not found", 404))
    return res.status(200).json(new ApiResponse(200, appointment, ""))
})

export const markApptasCompleted = catchAsyncError(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id)
    if (!appointment) return next(new ErrorHandler("Appointment not found", 404))

    if (appointment.employee.toString() !== req.employee._id.toString())
        return next(new ErrorHandler("Unauthorized employee", 401))
    if (appointment.status !== "Booked") return next(new ErrorHandler("Action not possible", 400))
    appointment.status = "Completed"
    await appointment.save()
    return res.status(200).json(new ApiResponse(200, appointment, "Appointment marked as complete"))
})

export const cancelAppointmentofUserByEmployee = catchAsyncError(async (req, res, next) => {
    const { cancelReason } = req.body
    if (!cancelReason) return next(new ErrorHandler("Cancel reason required", 400))

    const appointment = await Appointment.findById(req.params.id)
    // console.log(appointment)
    if (!appointment) return next(new ErrorHandler("Appointment not found", 404))

    if (appointment.employee.toString() !== req.employee._id.toString())
        return next(new ErrorHandler("Unauthorized employee", 401))

    if (appointment.status !== "Booked") return next(new ErrorHandler("Action not possible", 400))

    appointment.status = "Cancelled"
    appointment.cancelReason = cancelReason
    await appointment.save()

    return res.status(200).json(new ApiResponse(200, appointment, "Appointment marked as complete"))
})
