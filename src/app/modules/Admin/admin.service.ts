

import { Admin, EventCategory, EventStatus, HostApplicationStatus, Prisma, UserRole, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper";


import { IPaginationOptions } from "../../interfaces/pagination";
import { eventSearchableFields, clientSearchableFields, hostProfileSearchableFields, hostSearchableFields } from "./admin.constant";
import prisma from "../../../shared/prisma";


const getAllHostApplications = async (params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions: Prisma.HostApplicationWhereInput[] = [];

    // Only show PENDING and REJECTED applications
    andConditions.push({
        status: {
            in: [HostApplicationStatus.PENDING]
        }
    });

    if (params.searchTerm) {
        andConditions.push({
            OR: hostSearchableFields.map(field => ({
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
        hostRequests: result
    };
}

const getAllClients = async (params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, status, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = [];

    // must be CLIENT
    andConditions.push({ role: UserRole.CLIENT });

    // ensure only users who actually have a client profile
    andConditions.push({
        client: { isNot: null }
    });

    // globally searchable fields (User.email + Client.name + Client.contactNumber)
    if (searchTerm) {
        andConditions.push({
            OR: [
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { client: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        });
    }

    // status filter applies to User.status
    if (status) {
        andConditions.push({ status: status as UserStatus });
    }

    // dynamic filtering for other fields
    if (Object.keys(filterData).length > 0) {
        const extraFilters: Prisma.UserWhereInput[] = [];

        for (const key of Object.keys(filterData)) {
            const value = (filterData as any)[key];

            if (clientSearchableFields.includes(key)) {
                // apply filter on nested client field
                extraFilters.push({
                    client: { [key]: { equals: value } }
                });
            } else {
                // filter on user field
                extraFilters.push({
                    [key]: { equals: value }
                });
            }
        }

        if (extraFilters.length) {
            andConditions.push({ AND: extraFilters });
        }
    }

    const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions as any } : {};


    const clients = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: 'desc' },
        include: {
            client: true,
        }
    });

    const total = await prisma.user.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        clients
    };
};


const getAllHosts = async (params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, status, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = [];

    // must be HOST
    andConditions.push({ role: UserRole.HOST });

    // ensure only users who actually have a host profile
    andConditions.push({
        host: { isNot: null }
    });

    // globally searchable fields (User.email + Client.name + Client.contactNumber)
    if (searchTerm) {
        andConditions.push({
            OR: [
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { host: { name: { contains: searchTerm, mode: 'insensitive' } } },
            ]
        });
    }

    // status filter applies to User.status
    if (status) {
        andConditions.push({ status: status as UserStatus });
    }

    // dynamic filtering for other fields
    if (Object.keys(filterData).length > 0) {
        const extraFilters: Prisma.UserWhereInput[] = [];

        for (const key of Object.keys(filterData)) {
            const value = (filterData as any)[key];

            if (hostProfileSearchableFields.includes(key)) {
                // apply filter on nested client field
                extraFilters.push({
                    host: { [key]: { equals: value } }
                });
            } else {
                // filter on user field
                extraFilters.push({
                    [key]: { equals: value }
                });
            }
        }

        if (extraFilters.length) {
            andConditions.push({ AND: extraFilters });
        }
    }

    const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions as any } : {};


    const clients = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: 'desc' },
        include: {
            host: true,
        }
    });

    const total = await prisma.user.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        clients
    };
};


const getAllEventApplications = async (params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, category, date, status, ...filterData } = params;

    const andConditions: Prisma.EventWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: eventSearchableFields.map(field => ({
                [field]: { contains: String(searchTerm), mode: 'insensitive' }
            }))
        });
    }

    if (status) {
        andConditions.push({ status: status as any });
    }

    andConditions.push({ status: "PENDING" });

    if (category) {
        andConditions.push({
            category: {
                has: category as EventCategory
            }
        });
    }

    if (date) {
        const parsed = new Date(String(date));
        if (!isNaN(parsed.getTime())) {
            const start = new Date(parsed);
            start.setHours(0, 0, 0, 0);
            const end = new Date(parsed);
            end.setHours(23, 59, 59, 999);
            andConditions.push({ date: { gte: start, lte: end } } as any);
        }
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: { equals: (filterData as any)[key] }
            }))
        } as any);
    }

    const whereConditions: Prisma.EventWhereInput = andConditions.length > 0 ? { AND: andConditions as any } : {};

    const result = await prisma.event.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: 'desc' },
        include: { host: true }
    });

    const total = await prisma.event.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        eventRequests: result
    };
};

// approve event


// approve host application
const approveHostApplication = async (id: string) => {
    const isHostApplicationExist = await prisma.hostApplication.findUniqueOrThrow({
        where: { id },
        include: { user: true }
    });

    console.log(isHostApplicationExist)

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
                interests: existingClientInfo.interests,
                location: existingClientInfo.location
            }
        });
        

        // await sendEmail({
        //     to: newHost.email,
        //     subject: "Congratulations! Your Host Application Approved",
        //     templateName: "host-application-approved",
        //     templateData: {
        //         name: newHost.name,
        //     }
        // });
        

        return {
            message: "Host approved successfully",
            host: newHost
        };
    });

    return result;
};

// reject host application
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

    // await sendEmail({
    //     to: existingClientInfo.email,
    //     subject: "Host Application Status Update",
    //     templateName: "host-application-rejected",
    //     templateData: {
    //         name: existingClientInfo.name || "User",
    //     }
    // });

    return result;
};

// approve event into DB
const approveEventIntoDB = async (id: string) => {
    console.log(id)
    const isEventExist = await prisma.event.findUniqueOrThrow({
        where: { id }
    });

    if (!isEventExist) {
        throw new Error("Event not found!");
    }

    if (isEventExist.status !== 'PENDING') {
        throw new Error("Only PENDING events can be approved.");
    }
    const result = await prisma.event.update({
        where: { id },
        include: { host: true },
        data: { status: EventStatus.OPEN }
    });

    // await sendEmail({
    //     to: result.host.email,
    //     subject: "Event Application Approval Update",
    //     templateName: "event-application-approved",
    //     templateData: {
    //         name: result.host.name,
    //     }
    // });

    return result;
};

// reject event into db 
const rejectEvent = async (id: string) => {
    const isEventExist = await prisma.event.findUniqueOrThrow({
        where: { id }
    });

    console.log(isEventExist)

    if (!isEventExist) {
        throw new Error("Event not found!");
    }

    if (isEventExist.status !== 'PENDING') {
        throw new Error("Only PENDING events can be rejected.");
    }

    const result = await prisma.event.update({
        where: { id },
        include: { host: true },
        data: { status: EventStatus.REJECTED }
    });

    // await sendEmail({
    //     to: result.host.email,
    //     subject: "Event Application Rejected",
    //     templateName: "event-application-rejected",
    //     templateData: {
    //         name: result.host.name,
    //     }
    // });
    return result;
}

const suspendUser = async (id: string) => {
    console.log(id)

    const isExistingUser = await prisma.user.findUniqueOrThrow({
        where: { id }
    });

    if (!isExistingUser) {
        throw new Error("User not found");
    }

    const result = await prisma.user.update({
        where: { id },
        data: {
            status: UserStatus.SUSPENDED
        }
    });

    return result;
}

const unsuspendUser = async (id: string) => {
    console.log(id)

    const isExistingUser = await prisma.user.findUniqueOrThrow({
        where: { id }
    });

    if (!isExistingUser) {
        throw new Error("User not found");
    }

    const result = await prisma.user.update({
        where: { id },
        data: {
            status: UserStatus.ACTIVE
        }
    });

    return result;
}


export const AdminService = {
    getAllEventApplications,
    approveEventIntoDB,
    getAllHostApplications,
    approveHostApplication,
    rejectHostApplication,
    rejectEvent,
    getAllClients,
    getAllHosts,
    suspendUser,
    unsuspendUser
}
