
import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";


const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  let statusCode: number = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message: string = err.message || "Something went wrong!";
  let error: any = err;


  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2000":
        message = "Value too long for column";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2002":
        message = "Unique constraint failed (duplicate key)";
        statusCode = httpStatus.CONFLICT;
        break;
      case "P2003":
        message = "Foreign key constraint failed";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2004":
        message = "A constraint failed";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2005":
        message = "Invalid type for field";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2006":
        message = "Field required error";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2007":
        message = "Data validation failed";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2008":
        message = "Failed to parse value";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2009":
        message = "Invalid query";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2010":
        message = "Missing required argument";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P1000":
        message = "Authentication failed against database server";
        statusCode = httpStatus.BAD_GATEWAY;
        break;
      default:
        message = "Prisma error occurred";
        statusCode = httpStatus.BAD_REQUEST;
        break;
    }
    error = {
      statusCode,
      message,
      meta: err.meta
    };
  }


  else if (err instanceof Prisma.PrismaClientValidationError) {
    message = "Validation error: " + err.message;
    statusCode = httpStatus.BAD_REQUEST;
    error = {
      statusCode,
      message
    };
  }


  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    message = "Unknown Prisma error occurred";
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    error = {
      statusCode,
      message
    };
  }

  else if (err instanceof Prisma.PrismaClientInitializationError) {
    message = "Prisma client failed to initialize";
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    error = {
      statusCode,
      message
    };
  }

  else if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
    message = err.message || message;
    statusCode = err.statusCode || statusCode;
    error = {
      statusCode,
      message: err.message || message,
      ...(err.stack && { stack: err.stack })
    };
  }

  return res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandler;
