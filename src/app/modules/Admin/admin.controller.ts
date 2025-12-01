import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AdminService } from './admin.service';
import pick from '../../../shared/pick';
import { adminFilterableFields, eventFilterableFields, hostFilterableFields, hostSearchableFields } from './admin.constant';

import httpStatus from 'http-status';
import { sendResponse } from '../../../shared/sendResponse';
import { catchAsync } from '../../../shared/catchAsync';






// get all host applications
const getAllHostApplications: RequestHandler = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, hostFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const result = await AdminService.getAllHostApplications(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All Host applications fetched!",
        data: result
    });
});

// get all event applications
const getAllEventApplications: RequestHandler = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, eventFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const result = await AdminService.getAllEventApplications(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All Events applications fetched!",
        data: result
    });

})



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


const approveEventIntoDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.approveEventIntoDB(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event approved!",
        data: result
    })
});

// reject event
const rejectEvent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.rejectEvent(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event rejected!",
        data: result
    })
})

export const AdminController = {
    getAllEventApplications,
    approveEventIntoDB,
    getAllHostApplications,
    approveHost,
    rejectHost,
    rejectEvent
}