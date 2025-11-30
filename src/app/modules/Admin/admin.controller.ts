import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AdminService } from './admin.service';
import pick from '../../../shared/pick';
import { adminFilterableFields, hostSearchableFields } from './admin.constant';

import httpStatus from 'http-status';
import { sendResponse } from '../../../shared/sendResponse';
import { catchAsync } from '../../../shared/catchAsync';






const updateIntoDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.updateIntoDB(id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin data updated!",
        data: result
    })
})




// get all host applications
const getAllHostApplications: RequestHandler = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, hostSearchableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const result = await AdminService.getAllHostApplications(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All Host applications fetched!",
        data: result
    });
});

//  approve host application 

const approveHost = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.approveHostApplication(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host application approved!",
        data: result
    })
});


// reject host 

const rejectHost = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.rejectHostApplication(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host application rejected!",
        data: result
    })
});

    export const AdminController = {
        updateIntoDB,
        getAllHostApplications,
        approveHost,
        rejectHost
    }