import { Request, Response } from "express";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import httpStatus from 'http-status';
import { hostService } from "./host.service";
import pick from "../../../shared/pick";
import { eventFilterableFields } from "../Admin/admin.constant";

const createEvent = catchAsync(async (req: Request, res: Response) => {

    const result = await hostService.createEvent(req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event Created successfully!",
        data: result
    })
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await hostService.deleteEvent(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event Deleted successfully!",
        data: result
    })
});
const updateEvent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(req.body)
    const result = await hostService.updateEvent(id, req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event Updated successfully!",
        data: result
    })
});

const cancelEvent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await hostService.cancelEvent(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event Have Been Canceled!",
        data: result
    })
})

// get my events
const getMyEvents = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const user = req.cookies;
    const filters = pick(req.query, eventFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const result = await hostService.getMyEvents(user,filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My Events retrieved successfully",
        data: result
    });
});

export const hostController = {
    createEvent,
    deleteEvent,
    updateEvent,
    cancelEvent,
    getMyEvents
};