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

const getLatestReviews = catchAsync(async (req: Request, res: Response) => {
    const result = await reviewService.getLatestReviews();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Latest 20 reviews retrieved successfully',
        data: result
    });
});

const checkReviewExists = catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.params;

    const result = await reviewService.checkReviewExists(transactionId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Review check completed',
        data: result
    });
});

export const reviewController = {
    createReview,
    getLatestReviews,
    checkReviewExists
};
