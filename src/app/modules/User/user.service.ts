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




const createClient = async (req: Request): Promise<Client> => {

    let imageUrl = "";

    imageUrl = req.file?.path || "";


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
    // Fetch base user
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

    // ==================== ADMIN ====================
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

    // ==================== CLIENT ====================
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

    // ==================== HOST ====================
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

    // Merge results and return
    return { ...userInfo, ...profileInfo };
};



const updateMyProfile = async (user: IAuthUser, req: Request) => {
    let newImageUrl = "";
    console.log(JSON.stringify(req.body))

    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            email: user?.email,
            status: UserStatus.ACTIVE
        }
    });

    console.log(userInfo)


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

            if(!existingClient){
                throw new Error('Client not found');
            }

            if (newImageUrl) {
                await deleteImageFromCloudinary(existingClient?.profilePhoto);
            }

            // Handle interests merging
            if (req.body?.interests) {
                const oldInterests = existingClient?.interests || [];

                if (req.body.interests.length === 0) {
                    req.body.interests = oldInterests;
                } else {
                    req.body.interests = Array.from(
                        new Set([...oldInterests, ...req.body.interests])
                    );
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



export const userService = {
    createClient,
    getAllFromDB,
    changeProfileStatus,
    getMyProfile,
    updateMyProfile
}