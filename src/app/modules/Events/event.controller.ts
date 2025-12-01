import { Request, Response } from "express";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import httpStatus from 'http-status';
import pick from "../../../shared/pick";
import { eventFilterableFields } from "../Admin/admin.constant";
import { eventService } from "./event.service";


// get all events
const getAllEvents = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const filters = pick(req.query, eventFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const result = await eventService.getAllEvents(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All Events retrieved successfully",
        data: result
    });
});

export const eventController = {
    getAllEvents
};