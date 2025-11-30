

import bcrypt from 'bcryptjs';

import ApiError from "../../errors/ApiError";
import { createNewAccessTokenWithRefreshToken, createUserToken } from "../../../helpers/userToken";

import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelper } from "../../../helpers/jwtHelper";
import { sendEmail } from "../../../helpers/sendEmail";
import prisma from '../../../shared/prisma';
import { HostApplicationStatus, UserStatus } from '@prisma/client';
import httpStatus from 'http-status-codes';


const loginUser = async (payload: { email: string, password: string }) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE
        }
    })

    const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
    if (!isCorrectPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect!")
    }
    const userToken = createUserToken(user);


    return {
        ...userToken,
        needPasswordChange: user.needPasswordChange
    }
}


const refreshToken = async (token: string) => {

    const newTokens = await createNewAccessTokenWithRefreshToken(token);

    return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        needPasswordChange: newTokens.needPasswordChange
    };

};


const changePassword = async (user: any, payload: any) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: user.email,
            status: UserStatus.ACTIVE
        }
    });

    const isCorrectPassword: boolean = await bcrypt.compare(payload.oldPassword, userData.password);

    if (!isCorrectPassword) {
        throw new Error("Password incorrect!")
    }

    const hashedPassword: string = await bcrypt.hash(payload.newPassword, Number(config.salt_round));

    await prisma.user.update({
        where: {
            email: userData.email
        },
        data: {
            password: hashedPassword,
            needPasswordChange: false
        }
    })

    return {
        message: "Password changed successfully!"
    }
};

const forgotPassword = async (payload: { email: string }) => {

    console.log(payload)

    const userData = await prisma.user.findFirstOrThrow({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE
        }
    });


    console.log(userData)

    const resetPassToken = jwtHelper.generateToken(
        { email: userData.email, role: userData.role },
        config.jwt.reset_pass_secret as Secret,
        config.jwt.reset_pass_token_expires_in as string
    )

    const resetPassLink = config.reset_pass_link + `?userId=${userData.id}&token=${resetPassToken}`

    await sendEmail({
        to: userData.email,
        subject: "Password Reset Request",
        templateName: "reset-password",
        templateData: {
            name: userData.email.split("@")[0],
            resetPassLink,
        }
    });
};

const resetPassword = async (token: string, payload: { id: string, password: string }) => {

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id: payload.id,
            status: UserStatus.ACTIVE
        }
    });

    const isValidToken = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret)

    if (!isValidToken) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!")
    }

    // hash password
    const password = await bcrypt.hash(payload.password, Number(config.salt_round));

    // update into database
    await prisma.user.update({
        where: {
            id: payload.id
        },
        data: {
            password,
            needPasswordChange: false
        }
    })
};

const getMe = async (user: any) => {
    const accessToken = user.accessToken;

    const decodedData = jwtHelper.verifyToken(
        accessToken,
        config.jwt.jwt_secret as Secret
    );

    const role = decodedData.role;

    let includeOptions: any = {};

    if (role === "ADMIN") {
        includeOptions.admin = {
            select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
                contactNumber: true,
                income: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
            },
        };
    }

    if (role === "CLIENT") {
        includeOptions.client = {
            select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
                bio: true,
                contactNumber: true,
                location: true,
                interests: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
            },
        };
    }

    if (role === "HOST") {
        includeOptions.host = {
            select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
                bio: true,
                contactNumber: true,
                location: true,
                income: true,
                rating: true,
                ratingCount: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
            },
        };
    }

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: UserStatus.ACTIVE,
        },
        select: {
            id: true,
            email: true,
            role: true,
            needPasswordChange: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            ...includeOptions,
        },
    });

    return userData;
};



const applyHost = async (user: any) => {
    const accessToken = user.accessToken;
    const decodedData = jwtHelper.verifyToken(
        accessToken,
        config.jwt.jwt_secret as Secret
    );
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id: decodedData.userId
        }
    });



    if (!userData) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const result = await prisma.$transaction(async (transactionClient) => {
        const existingApplication = await transactionClient.hostApplication.findFirst({
            where: {
                userId: userData.id,
                status: HostApplicationStatus.PENDING,
            },
        });
        if (existingApplication) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You have already applied to be a host. Please wait for approval.");
        }

        const application = await transactionClient.hostApplication.create({
            data: {
                userId: userData.id,
            }
        });

        const userUpdate = await transactionClient.user.update({
            where: {
                id: userData.id,
            },
            data: {
                status: UserStatus.PENDING,
            }
        });

        // send email to host new host application
        // await sendEmail({
        //     to,
        //     subject: "Host Application Submitted",
        //     templateName: "host-application-submitted",
        //     templateData: {
        //         name,
        //         applicationId,
        //     }
        // })

        const clientData = await transactionClient.client.findFirst({
            where: {
                email: userData.email
            }
        });

        await sendEmail({
            to: userData.email,
            subject: "Your Host Application Submitted",
            templateName: "host-application-submitted",
            templateData: {
                name: clientData ? clientData.name : userData.email.split("@")[0],
                applicationId: application.id,
            }
        });

        return { ...application, ...userUpdate };
    });

    return result;
};

export const AuthServices = {
    loginUser,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
    applyHost
}