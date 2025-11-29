import { Request, Response } from "express";

import { MetaService } from "./meta.service";

import httpStatus from "http-status";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";



const fetchDashboardMetaData = catchAsync(async (req: Request, res: Response) => {

    const user = req.user;
    const result = await MetaService.fetchDashboardMetaData(user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Meta data retrieval successfully!",
        data: result
    })
});

export const MetaController = {
    fetchDashboardMetaData
}