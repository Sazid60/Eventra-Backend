import { Request, Response } from "express";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import httpStatus from 'http-status';
import pick from "../../../shared/pick";
import { eventFilterableFields } from "../Admin/admin.constant";
import { eventService } from "./event.service";
import { jwtHelper } from "../../../helpers/jwtHelper";
import { Secret } from "jsonwebtoken";
import config from "../../../config";


// get all events
const getAllEvents = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const filters = pick(req.query, eventFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const accessToken = req.cookies['accessToken'];

    const user = jwtHelper.verifyToken(
        accessToken,
        config.jwt.jwt_secret as Secret
    );

    console.log(user)
    const result = await eventService.getAllEvents(filters, options, user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All Events retrieved successfully",
        data: result
    });
});
const getSingleEvent = catchAsync(async (req: Request & { user?: any }, res: Response) => {

    const { id } = req.params;
    const result = await eventService.getSingleEvent(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Single Event retrieved successfully",
        data: result
    });
});
const joinEvent = catchAsync(async (req: Request & { user?: any }, res: Response) => {

    const { id } = req.params;
    const user = req.user;

    console.log(id)
    console.log(user)
    const result = await eventService.joinEvent(id, user);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your have joined  Event successfully",
        data: result
    });
});

export const eventController = {
    getAllEvents,
    getSingleEvent,
    joinEvent
};