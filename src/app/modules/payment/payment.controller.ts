import { Request, Response } from "express";
import { catchAsync } from "../../../shared/catchAsync";
import config from "../../../config";
import { paymentServices } from "./payment.service";



const successPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await paymentServices.successPayment(query as Record<string, string>)

    if (result.success) {
        res.redirect(`${config.FRONTEND_URL}/client/dashboard/my-events`)
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

export const PaymentController = {
    successPayment,
    failPayment,
    cancelPayment,
};