import { Request, Response } from "express";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import httpStatus from 'http-status';
import { hostService } from "./host.service";

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
export const hostController = {
    createEvent,
    deleteEvent,
    updateEvent
};