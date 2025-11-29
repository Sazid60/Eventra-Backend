import type { NextFunction, Request, Response } from "express"
import config from "../config";


type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

export const catchAsync = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => {
        if (config.node_env === "development") {
            console.log(err);
        }
        next(err)
    })
}
