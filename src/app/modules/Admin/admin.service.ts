

import { Admin, HostApplicationStatus, Prisma, UserRole, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper";


import { IPaginationOptions } from "../../interfaces/pagination";
import { adminSearchAbleFields } from "./admin.constant";
import { IAdminFilterRequest } from "./admin.interface";
import prisma from "../../../shared/prisma";
import { sendEmail } from "../../../helpers/sendEmail";



const updateIntoDB = async (id: string, data: Partial<Admin>): Promise<Admin> => {
    await prisma.admin.findUniqueOrThrow({
        where: {
            id,
            isDeleted: false
        }
    });

    const result = await prisma.admin.update({
        where: {
            id
        },
        data
    });

    return result;
};



// get all host applications
const getAllHostApplications = async (params: IAdminFilterRequest, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions: Prisma.AdminWhereInput[] = [];

    if (params.searchTerm) {
        andConditions.push({
            OR: adminSearchAbleFields.map(field => ({
                [field]: {
                    contains: params.searchTerm,
                    mode: 'insensitive'
                }
            }))
        })
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    }

    const whereConditions: Prisma.HostApplicationWhereInput = andConditions.length > 0 ? { AND: andConditions as any } : {};

    const result = await prisma.hostApplication.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? {
            [options.sortBy]: options.sortOrder
        } : {
            createdAt: 'desc'
        },
        include: {
            user: true
        }
    });

    const total = await prisma.hostApplication.count({ where: whereConditions });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
}

// approve host application
const approveHostApplication = async (id: string) => {
    const isHostApplicationExist = await prisma.hostApplication.findUniqueOrThrow({
        where: { id },
        include: { user: true }
    });

    const existingClientInfo = await prisma.client.findUnique({
        where: { email: isHostApplicationExist.user.email }
    });

    if (!existingClientInfo) {
        throw new Error("Client info not found");
    }

        if (isHostApplicationExist.status === HostApplicationStatus.REJECTED) {
        throw new Error("This host application is already rejected.");
    }

    if (isHostApplicationExist.status === HostApplicationStatus.APPROVED) {
        throw new Error("This application is already approved and cannot be rejected.");
    }

    const result = await prisma.$transaction(async (tx) => {

        // 1. Update host application status
        await tx.hostApplication.update({
            where: { id },
            data: { status: HostApplicationStatus.APPROVED }
        });

        // 2. Update user role & status
        await tx.user.update({
            where: { id: isHostApplicationExist.userId },
            data: {
                role: UserRole.HOST,
                status: UserStatus.ACTIVE
            }
        });

        // 3. Soft delete client info
        await tx.client.update({
            where: { email: existingClientInfo.email },
            data: { isDeleted: true }
        });

        // 4. Create host profile
        const newHost = await tx.host.create({
            data: {
                name: existingClientInfo.name,
                email: existingClientInfo.email,
                profilePhoto: existingClientInfo.profilePhoto,
                contactNumber: existingClientInfo.contactNumber,
                bio: existingClientInfo.bio,
                location: existingClientInfo.location
            }
        });

        await sendEmail({
            to: newHost.email,
            subject: "Congratulations! Your Host Application Approved",
            templateName: "host-application-approved",
            templateData: {
                name: newHost.name,
            }
        });

        return {
            message: "Host approved successfully",
            host: newHost
        };
    });

    return result;
};


const rejectHostApplication = async (id: string) => {
    const isHostApplicationExist = await prisma.hostApplication.findUniqueOrThrow({
        where: { id },
        include: { user: true }
    });

    if (isHostApplicationExist.status === HostApplicationStatus.REJECTED) {
        throw new Error("This host application is already rejected.");
    }

    if (isHostApplicationExist.status === HostApplicationStatus.APPROVED) {
        throw new Error("This application is already approved and cannot be rejected.");
    }

    const existingClientInfo = await prisma.client.findUnique({
        where: { email: isHostApplicationExist.user.email }
    });

    if (!existingClientInfo) {
        throw new Error("Client info not found");
    }

    const result = await prisma.$transaction(async (tx) => {

        const updatedApplication = await tx.hostApplication.update({
            where: { id },
            data: { status: HostApplicationStatus.REJECTED }
        });


        await tx.user.update({
            where: { id: isHostApplicationExist.userId },
            data: { status: UserStatus.ACTIVE }
        });


        return {
            message: "Host application rejected successfully",
            application: updatedApplication
        };
    });

    await sendEmail({
        to: existingClientInfo.email,
        subject: "Host Application Status Update",
        templateName: "host-application-rejected",
        templateData: {
            name: existingClientInfo.name || "User",
        }
    });

    return result;
};


export const AdminService = {
    updateIntoDB,
    getAllHostApplications,
    approveHostApplication,
    rejectHostApplication
}
