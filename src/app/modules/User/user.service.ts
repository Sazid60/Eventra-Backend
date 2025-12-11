import { Admin, Client, Prisma, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from 'bcryptjs';
import { Request } from "express";
import config from "../../../config";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { userSearchAbleFields } from "./user.constant";
import { deleteImageFromCloudinary } from "../../../config/cloudinary.config";
import { sendEmail } from "../../../helpers/sendEmail";




const createClient = async (req: Request): Promise<Client> => {

    let imageUrl = "";

    imageUrl = req.file?.path || "";

    const existingUser = await prisma.user.findUnique({
        where: { email: req.body.client.email }
    });

    if (existingUser) {
        if (imageUrl) await deleteImageFromCloudinary(imageUrl);
        throw new Error("User with this email already exists");
    }

    const hashedPassword: string = await bcrypt.hash(req.body.password, Number(config.salt_round))

    const userData = {
        email: req.body.client.email,
        password: hashedPassword,
        role: UserRole.CLIENT
    }
    console.log(userData)

    try {
        const result = await prisma.$transaction(async (transactionClient) => {
            await transactionClient.user.create({
                data: {
                    ...userData,
                    needPasswordChange: false
                }
            });

            const createdClientData = await transactionClient.client.create({
                data: {
                    ...req.body.client,
                    profilePhoto: imageUrl
                }
            });

            return createdClientData;
        });

        return result;
    } catch (error) {
        if (imageUrl) await deleteImageFromCloudinary(imageUrl);
        throw error;
    }
};

const getAllFromDB = async (params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = [];

    if (params.searchTerm) {
        andConditions.push({
            OR: userSearchAbleFields.map(field => ({
                [field]: {
                    contains: params.searchTerm,
                    mode: 'insensitive'
                }
            }))
        })
    };

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    };

    const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? {
            [options.sortBy]: options.sortOrder
        } : {
            createdAt: 'desc'
        },
        select: {
            id: true,
            email: true,
            role: true,
            needPasswordChange: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            admin: true,
        }
    });

    const total = await prisma.user.count({
        where: whereConditions
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
};

const changeProfileStatus = async (id: string, status: UserRole) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    });

    const updateUserStatus = await prisma.user.update({
        where: {
            id
        },
        data: status
    });

    return updateUserStatus;
};

const getMyProfile = async (user: IAuthUser) => {

    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            email: user?.email,
            status: UserStatus.ACTIVE,
        },
        select: {
            id: true,
            email: true,
            needPasswordChange: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    let profileInfo = null;

 
    if (userInfo.role === UserRole.ADMIN) {
        profileInfo = await prisma.admin.findUnique({
            where: { email: userInfo.email },
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
        });
    }


    else if (userInfo.role === UserRole.CLIENT) {
        profileInfo = await prisma.client.findUnique({
            where: { email: userInfo.email },
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
        });
    }


    else if (userInfo.role === UserRole.HOST) {
        profileInfo = await prisma.host.findUnique({
            where: { email: userInfo.email },
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
        });
    }

    return { ...userInfo, ...profileInfo };
};



const updateMyProfile = async (user: IAuthUser, req: Request) => {
    let newImageUrl = "";
    console.log(JSON.stringify(req.body))

    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            email: user?.email
        }
    });

    console.log(userInfo)

    if(!userInfo) {
        throw new Error("User not found");
    }

    if(userInfo?.status === "SUSPENDED") throw new Error("Your account has been suspended. You cannot perform this operation.");


    if (req.file) {
        newImageUrl = req.file.path;
        req.body.profilePhoto = newImageUrl;
    }


    let profileInfo;

    try {
        if (userInfo.role === UserRole.ADMIN) {
            profileInfo = await prisma.admin.update({
                where: {
                    email: userInfo.email
                },
                data: req.body
            })
        } else if (userInfo.role === UserRole.CLIENT) {

            const existingClient = await prisma.client.findUnique({
                where: { email: userInfo.email },
            });

            if (!existingClient) {
                throw new Error('Client not found');
            }

            if (newImageUrl) {
                await deleteImageFromCloudinary(existingClient?.profilePhoto);
            }

  
            if (req.body?.interests !== undefined) {
                if (Array.isArray(req.body.interests) && req.body.interests.length > 0) {

                    req.body.interests = req.body.interests;
                } else {

                    req.body.interests = existingClient?.interests || [];
                }
            }

            profileInfo = await prisma.client.update({
                where: { email: userInfo.email },
                data: req.body,
            });
        } else if (userInfo.role === UserRole.HOST) {
            profileInfo = await prisma.host.update({
                where: {
                    email: userInfo.email
                },
                data: req.body
            })
        }

        return { ...profileInfo };
    } catch (error) {
        if (newImageUrl) await deleteImageFromCloudinary(newImageUrl);

        throw error;
    }
}



const sendContactEmail = async (payload: { name: string; email: string; contactNumber: string; subject: string; message: string }) => {
    const { name, email, contactNumber, subject, message } = payload;


    await sendEmail({
        to: config.admin_email,
        subject: `Contact Form: ${subject}`,
        templateName: 'contact-email',
        templateData: {
            name,
            email,
            contactNumber,
            subject,
            message,
        },
    });

    return { message: 'Contact email sent successfully' };
};

export const userService = {
    createClient,
    getAllFromDB,
    changeProfileStatus,
    getMyProfile,
    updateMyProfile,
    sendContactEmail
}