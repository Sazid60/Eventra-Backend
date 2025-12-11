import type { NextFunction, Request, Response } from "express"
import { jwtHelper } from "../../helpers/jwtHelper";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status"
import config from "../../config";
import type { Secret } from "jsonwebtoken";


const auth = (...roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.cookies["accessToken"];

            if (!token) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!")
            }

            const verifyUser = jwtHelper.verifyToken(token, config.jwt.jwt_secret);

            req.user = verifyUser;
            

            if (roles.length && !roles.includes(verifyUser.role)) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!")
            }

            next();
        }
        catch (err) {
            next(err)
        }
    }
}

export default auth;