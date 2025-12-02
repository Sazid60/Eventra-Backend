import { Event, EventCategory, EventStatus, Prisma } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { Request } from "express";
import { Secret } from "jsonwebtoken";
import { jwtHelper } from "../../../helpers/jwtHelper";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { eventSearchableFields } from "../Admin/admin.constant";

const createEvent = async (req: Request): Promise<Event> => {
    const file = req.file;

    const accessToken = req.cookies["accessToken"]
    console.log(accessToken)

    const decodedData = jwtHelper.verifyToken(
        accessToken,
        config.jwt.jwt_secret as Secret
    );

    let uploadedPublicId: string | undefined;
    if (file) {
        const uploadedProfileImage = await fileUploader.uploadToCloudinary(file);
        req.body.image = uploadedProfileImage?.secure_url;
        uploadedPublicId = (uploadedProfileImage as any)?.public_id;
    }

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id: decodedData.userId
        },
        include: {
            host: true
        }
    });

    if (!userData || !userData.host) {
        throw new Error("User not found");
    }


    try {
        const result = await prisma.$transaction(async (transactionClient) => {
            const createdEventData = await transactionClient.event.create({
                data: {
                    ...req.body,
                    hostId: userData.host?.id,
                }
            });

            return createdEventData;
        });

        return result;


    } catch (error) {
        if (uploadedPublicId) {
            await fileUploader.deleteFromCloudinary(uploadedPublicId as string);
        }
        throw error;
    }
};

const deleteEvent = async (id: string): Promise<Event> => {
    const isEventExist = await prisma.event.findUnique({
        where: { id }
    });
    if (!isEventExist) {
        throw new Error("Event not found!");
    }

    if (
        isEventExist.status !== EventStatus.CANCELLED &&
        isEventExist.status !== EventStatus.REJECTED &&
        isEventExist.status !== EventStatus.PENDING
    ) {
        throw new Error("Only PENDING, CANCELLED or REJECTED events can be deleted.");
    }

    const result = await prisma.event.delete({
        where: { id }
    });
    return result;
}
const updateEvent = async (id: string, req: Request): Promise<Event> => {
    const existingEvent = await prisma.event.findUnique({
        where: { id }
    });

    if (!existingEvent) {
        throw new Error("Event not found!");
    }

    if (
        existingEvent.status === EventStatus.CANCELLED ||
        existingEvent.status === EventStatus.REJECTED ||
        existingEvent.status === EventStatus.COMPLETED
    ) {
        throw new Error("Only Pending, Open or Full events can be updated.");
    }

    const updateData: any = { ...req.body };


    console.log(updateData)

    if (req.body.category) {
        if (req.body.category.length === 0) {
            updateData.category = existingEvent.category;
        } else {
            const merged = Array.from(
                new Set([...existingEvent.category, ...req.body.category])
            );

            updateData.category = merged;
        }
    }


    const file = req.file;
    let uploadedPublicId: string | undefined;
    if (file) {
        const uploadedProfileImage = await fileUploader.uploadToCloudinary(file);
        req.body.image = uploadedProfileImage?.secure_url;
        uploadedPublicId = (uploadedProfileImage as any)?.public_id;
    }

    try {
        return await prisma.event.update({
            where: { id },
            data: updateData
        });
    } catch (error) {
        if (uploadedPublicId) {
            await fileUploader.deleteFromCloudinary(uploadedPublicId);
        }
        throw error;
    }
};


const cancelEvent = async (id: string) => {
    const isEventExist = await prisma.event.findUniqueOrThrow({
        where: { id }
    });

    console.log(isEventExist)

    if (!isEventExist) {
        throw new Error("Event not found!");
    }

    if (isEventExist.status !== 'PENDING') {
        throw new Error("Only PENDING events can be canceled.");
    }

    const result = await prisma.event.update({
        where: { id },
        include: { host: true },
        data: { status: EventStatus.REJECTED }
    });

    return result;
}

// get my events
const getMyEvents = async (user: any, params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, category, date, status, ...filterData } = params;

    const accessToken = user.accessToken;

    const decodedData = jwtHelper.verifyToken(
        accessToken,
        config.jwt.jwt_secret as Secret
    );

    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            id: decodedData.userId
        },
        include: {
            host: true
        }
    });

    if (!userInfo.host) {
        throw new Error("Host information not found for the user.");
    }

    const andConditions: Prisma.EventWhereInput[] = [];

    andConditions.push({ hostId: userInfo.host.id });
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

// complete event 

const completeEvent = async (id: string) => {
    const isEventExist = await prisma.event.findUnique({
        where: { id },
        include: { host: true }
    });

    if (!isEventExist) {
        throw new Error('Event not found');
    }

    // Only allow completion when status is OPEN or FULL
    if (!(isEventExist.status === EventStatus.OPEN || isEventExist.status === EventStatus.FULL)) {
        throw new Error('Only events with status OPEN or FULL can be marked completed');
    }

    // Ensure current time is same or after event date/time
    const now = new Date();
    const eventDate = new Date(isEventExist.date);
    if (now.getTime() < eventDate.getTime()) {
        throw new Error('Event date/time has not occurred yet');
    }

    // mark as COMPLETED
    const updated = await prisma.event.update({
        where: { id },
        include: { host: true },
        data: { status: EventStatus.COMPLETED }
    });

    return updated;
}
export const hostService = {
    createEvent,
    deleteEvent,
    updateEvent,
    cancelEvent,
    getMyEvents,
    completeEvent
};