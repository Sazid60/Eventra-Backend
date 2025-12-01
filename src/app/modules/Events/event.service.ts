import { Event, EventCategory, EventStatus, Prisma } from "@prisma/client";
import config from "../../../config";
import prisma from "../../../shared/prisma";

import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { eventSearchableFields } from "../Admin/admin.constant";



// get my events
const getAllEvents = async (params: any, options: IPaginationOptions, user?: any) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, category, date, status, ...filterData } = params;

    const andConditions: Prisma.EventWhereInput[] = [];

    // Always get OPEN events
    andConditions.push({ status: EventStatus.OPEN });

    // Search
    if (searchTerm) {
        andConditions.push({
            OR: eventSearchableFields.map(field => ({
                [field]: { contains: String(searchTerm), mode: "insensitive" }
            }))
        });
    }

    // Exact match filters
    if (status) andConditions.push({ status: status as any });

    if (category) {
        andConditions.push({
            category: { has: category as EventCategory }
        });
    }

    if (date) {
        const parsed = new Date(String(date));
        if (!isNaN(parsed.getTime())) {
            const start = new Date(parsed);
            start.setHours(0, 0, 0, 0);

            const end = new Date(parsed);
            end.setHours(23, 59, 59, 999);

            andConditions.push({ date: { gte: start, lte: end } });
        }
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: { equals: (filterData as any)[key] }
            }))
        });
    }

    const whereConditions: Prisma.EventWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    /** FETCH ALL EVENTS (normal query) */
    const events = await prisma.event.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy:
            options.sortBy && options.sortOrder
                ? { [options.sortBy]: options.sortOrder }
                : { createdAt: "asc" },
        include: { host: true }
    });

    const total = await prisma.event.count({ where: whereConditions });

    /** ------------------------------
     * APPLY MIND-LIKE LOGIC HERE
     * ----------------------------- */

    if (user && user.role !== "ADMIN") {
        // Get user interests (client or host)
        const client = await prisma.client.findUnique({
            where: { email: user.email },
            select: { interests: true }
        });

        const host = await prisma.host.findUnique({
            where: { email: user.email },
            select: { interests: true }
        });

        const userInterests = client?.interests || host?.interests || [];

        if (userInterests.length > 0) {
            const mindLikeEvents = [];
            const otherEvents = [];

            // Split events into 2 groups
            for (const ev of events) {
                const match = ev.category.some(c =>
                    userInterests.includes(c as any)
                );

                if (match) mindLikeEvents.push(ev);
                else otherEvents.push(ev);
            }

            // Reorder: mind-like first, then others
            const orderedEvents = [...mindLikeEvents, ...otherEvents];

            return {
                meta: { page, limit, total },
                eventRequests: orderedEvents
            };
        }
    }

    // If admin or not logged in → return normal
    return {
        meta: { page, limit, total },
        eventRequests: events
    };
};


// 
const getSingleEvent = async (id: string) => {

    // fetch event + host + participants (client details)
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            host: true,
            participants: {
                include: {
                    client: true   // full client details (name, email, contact, location, etc.)
                }
            }
        }
    });

    if (!event) return null;

    // count participants
    const participantsCount = event.participants.length;

    // map clean participant info
    const participantsInfo = event.participants.map(p => ({
        id: p.id,
        joinedAt: p.createdAt,
        clientId: p.clientId,
        client: {
            id: p.client.id,
            name: p.client.name,
            email: p.client.email,
            profilePhoto: p.client.profilePhoto,
            contactNumber: p.client.contactNumber,
            location: p.client.location,
            bio: p.client.bio,
            interests: p.client.interests
        }
    }));

    return {
        ...event,
        participantsCount,
        participantsInfo
    };
};


export const eventService = {
    getAllEvents,
    getSingleEvent
};