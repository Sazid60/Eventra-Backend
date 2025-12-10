import { Request, Response } from "express";
import { catchAsync } from "../../../shared/catchAsync";
import config from "../../../config";
import { paymentServices } from "./payment.service";
import { sendResponse } from "../../../shared/sendResponse";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import pick from "../../../shared/pick";
import { paymentFilterableFields } from "./payment.constant";
import httpStatus from "http-status";



const successPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await paymentServices.successPayment(query as Record<string, string>)

    if (result.success) {
        res.redirect(`${config.FRONTEND_URL}/my-booked-events`)
    }
});
const failPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await paymentServices.failPayment(query as Record<string, string>)

    if (result.success) {
        res.redirect(`${config.FRONTEND_URL}/all-events`)
    }
});
const cancelPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await paymentServices.cancelPayment(query as Record<string, string>)

    if (result.success) {
        res.redirect(`${config.FRONTEND_URL}/all-events`)
    }
});

const validatePayment = catchAsync(
    async (req: Request, res: Response) => {
        console.log("sslcommerz ipn url body", req.body);
        await SSLService.validatePayment(req.body)
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Payment Validated Successfully",
            data: null,
        });
    }
);

const getUserPayments = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const filters = pick(req.query, paymentFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await paymentServices.getUserPayments(filters, options, req.user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User payments retrieved successfully",
        data: result
    });
});

export const PaymentController = {
    successPayment,
    failPayment,
    cancelPayment,
    validatePayment,
    getUserPayments
};