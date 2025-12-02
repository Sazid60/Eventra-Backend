import { Request, Response } from "express";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import httpStatus from 'http-status';
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const { transactionId } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;

    const result = await reviewService.createReview(transactionId, user, { rating, comment });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Review created successfully',
        data: result
    });
});

export const reviewController = {
    createReview,
};
