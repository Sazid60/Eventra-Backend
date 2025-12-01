import { Event, EventCategory, EventStatus, Prisma } from "@prisma/client";
import config from "../../../config";
import prisma from "../../../shared/prisma";

import { Secret } from "jsonwebtoken";
import { jwtHelper } from "../../../helpers/jwtHelper";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { eventSearchableFields } from "../Admin/admin.constant";



// get my events
const getAllEvents = async (params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, category, date, status, ...filterData } = params;

    const andConditions: Prisma.EventWhereInput[] = [];

    andConditions.push({ status: EventStatus.OPEN});
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


export const eventService = {
    getAllEvents
};