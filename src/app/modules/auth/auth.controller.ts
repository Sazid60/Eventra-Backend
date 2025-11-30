import type { Request, Response } from "express";

import { AuthServices } from "./auth.service";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { setAuthCookie } from "../../../helpers/setCookie";
import config from "../../../config";
import { convertExpiresInToMs } from "../../../helpers/convertExpiresInToMs";
import httpStatus from 'http-status';

const loginUser = catchAsync(async (req: Request, res: Response) => {

    const accessTokenMaxAge = convertExpiresInToMs(
        config.jwt.expires_in,
        1000 * 60 * 60 // default 1 hour
    );
    const refreshTokenMaxAge = convertExpiresInToMs(
        config.jwt.refresh_token_expires_in,
        1000 * 60 * 60 * 24 * 30 // default 30 days
    );
    const result = await AuthServices.loginUser(req.body)

    const tokenInfo = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        refreshTokenMaxAge: refreshTokenMaxAge,
        accessTokenMaxAge: accessTokenMaxAge
    }
    setAuthCookie(res, tokenInfo)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User Logged In Successfully",
        data: {
            needPasswordChange: result.needPasswordChange,
        }
    })
})


const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const accessTokenMaxAge = convertExpiresInToMs(
        config.jwt.expires_in,
        1000 * 60 * 60 // default 1 hour
    );
    const refreshTokenMaxAge = convertExpiresInToMs(
        config.jwt.refresh_token_expires_in,
        1000 * 60 * 60 * 24 * 30 // default 30 days
    );

    const result = await AuthServices.refreshToken(refreshToken);


    const tokenInfo = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        refreshTokenMaxAge: refreshTokenMaxAge,
        accessTokenMaxAge: accessTokenMaxAge
    }
    setAuthCookie(res, tokenInfo)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Access token generated successfully!",
        data: {
            message: "Access token generated successfully!",
        },
    });
});

const changePassword = catchAsync(
    async (req: Request & { user?: any }, res: Response) => {
        const user = req.user;

        const result = await AuthServices.changePassword(user, req.body);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Password Changed successfully",
            data: result,
        });
    }
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    await AuthServices.forgotPassword(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Check your email!",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = req.headers.authorization || "";
    console.log(token)

    await AuthServices.resetPassword(token, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password Reset!",
        data: null,
    });
});

const getMe = catchAsync(async (req: Request , res: Response) => {
    const user = req.cookies;

    const result = await AuthServices.getMe(user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});
const applyHost = catchAsync(async (req: Request, res: Response) => {
    const user = req.cookies;

    const result = await AuthServices.applyHost(user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host application submitted successfully",
        data: result,
    });
});





export const AuthController = {
    loginUser,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
    applyHost
};


