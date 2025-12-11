import { Event, EventCategory, EventStatus, ParticipantStatus, PaymentStatus, Prisma } from "@prisma/client";
import config from "../../../config";
import prisma from "../../../shared/prisma";

import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { eventSearchableFields } from "../Admin/admin.constant";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { clientEventSearchableFields } from "./event.constant";


const getTransactionId = () => {
    return `tran_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

// get my events
const getAllEvents = async (params: any, options: IPaginationOptions, user: any) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, category, date, status, ...filterData } = params;

    const andConditions: Prisma.EventWhereInput[] = [];

    // Always get OPEN events
    andConditions.push({ status: EventStatus.OPEN });

    // Only show events with dates in the future
    const now = new Date();
    andConditions.push({ date: { gte: now } });

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
                : { createdAt: "desc" },
        include: { host: true }
    });

    const total = await prisma.event.count({ where: whereConditions });

    console.log("total  :", total)

    console.log(user)


    if (user && user.role !== "ADMIN") {
        const client = await prisma.client.findUnique({
            where: { email: user.email },
            select: { interests: true }
        });

        console.log(client)

        console.log("client interests :", client?.interests);

        const host = await prisma.host.findUnique({
            where: { email: user.email },
            select: { interests: true }
        });

        const userInterests = client?.interests || host?.interests || [];

        if (userInterests.length > 0) {
            const mindLikeEvents = [];
            const otherEvents = [];

            for (const ev of events) {
                const match = ev.category.some(c =>
                    userInterests.includes(c as any)
                );

                console.log("match :", match);
                console.log("user Interest :", userInterests);

                if (match) mindLikeEvents.push(ev);
                else otherEvents.push(ev);
            }

            const orderedEvents = [...mindLikeEvents, ...otherEvents];

            return {
                meta: { page, limit, total },
                eventRequests: orderedEvents
            };
        }
    }
    return {
        meta: { page, limit, total },
        eventRequests: events
    };
};


//  get my events 
const getMyEvents = async (user: any, params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, category, date, status, participantStatus, ...filterData } = params;

    // Extract client ID
    const clientRecord = await prisma.user.findUniqueOrThrow({
        where: { email: user.email },
        include: { client: true }
    });

    if (!clientRecord.client) {
        throw new Error("You are not registered as a client");
    }

    const clientId = clientRecord.client.id;

    const eventFilters: Prisma.EventWhereInput[] = [];

    // Search filter inside event
    if (searchTerm) {
        eventFilters.push({
            OR: clientEventSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    // event status filter
    if (status) {
        eventFilters.push({ status });
    }

    // category filter
    if (category) {
        eventFilters.push({
            category: { has: category },
        });
    }

    // date filter
    if (date) {
        const parsed = new Date(String(date));
        if (!isNaN(parsed.getTime())) {
            const start = new Date(parsed);
            start.setHours(0, 0, 0, 0);

            const end = new Date(parsed);
            end.setHours(23, 59, 59, 999);

            eventFilters.push({ date: { gte: start, lte: end } });
        }
    }

    // Optional extra filters on event
    if (Object.keys(filterData).length > 0) {
        eventFilters.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: { equals: (filterData as any)[key] },
            })),
        });
    }




    // Final query
    const result = await prisma.eventParticipant.findMany({
        where: {
            clientId,
            ...(participantStatus && { participantStatus }), // filter participantStatus
            ...(eventFilters.length > 0 && { event: { AND: eventFilters } }),
        },
        include: {
            event: true,
            client: true,
        },
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: "desc" }
    });

    // Count total matching records based on the same conditions
    const total = await prisma.eventParticipant.count({
        where: {
            clientId,
            ...(participantStatus && { participantStatus }),
            ...(eventFilters.length > 0 && { event: { AND: eventFilters } }),
        },
    });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result
    };
};


// get single event
const getSingleEvent = async (id: string) => {

    // fetch event + host + participants (client details)
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            host: true,
            participants: {
                include: {
                    client: true
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

// get events participants
// const getEventsParticipants = async (eventId: string) => {
//     // const { page, limit, skip } = paginationHelper.calculatePagination(options);

//     const result = await prisma.eventParticipant.findMany({
//         where: {
//             eventId,
//             participantStatus: { not: ParticipantStatus.LEFT }
//         },
//         include: {
//             client: true
//         }
//     });
//     return {
//         data: result
//     };

// }

// get events participants
const getEventsParticipants = async (eventId: string) => {
    const result = await prisma.eventParticipant.findMany({
        where: {
            eventId,
            participantStatus: { not: ParticipantStatus.LEFT }
        },
        include: {
            client: true,
            review: true,  // ← ADD THIS
        }
    });

    const participantsWithReviewStatus = result.map(participant => ({
        ...participant,
        hasReviewed: !!participant.review,
        review: undefined,
    }));

    return {
        data: participantsWithReviewStatus
    };
}

// join event 

export const joinEvent = async (eventId: string, user: any) => {
    const client = await prisma.client.findUnique({
        where: { email: user.email },
        include: { user: true },
    });
    if (!client) throw new Error("Client not found");
    if (client?.user.status === "SUSPENDED") throw new Error("Your account has been suspended. You cannot perform this operation.");
    if (client.isDeleted) throw new Error("Client account is deleted");
    if (client.user.status !== "ACTIVE") throw new Error("Client account is not active");

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { host: true },
    });

    if (!event) throw new Error("Event not found");
    if (event.status !== EventStatus.OPEN) throw new Error("Event is not open");
    if (event.date < new Date()) throw new Error("Event date has passed");

    const existing = await prisma.eventParticipant.findFirst({
        where: {
            eventId,
            clientId: client.id,
            participantStatus: { not: ParticipantStatus.LEFT },
        },
    });

    if (existing) throw new Error("You have already joined this event");

    const transactionId = getTransactionId();

    const result = await prisma.$transaction(async (tx) => {
        // Reload event to ensure latest capacity
        const eventForUpdate = await tx.event.findUnique({
            where: { id: eventId },
        });

        if (!eventForUpdate) throw new Error("Event not found");

        if (eventForUpdate.capacity < 1) {
            throw new Error("No seats available");
        }

        // Create participant
        const newParticipant = await tx.eventParticipant.create({
            data: {
                eventId,
                clientId: client.id,
                participantStatus: ParticipantStatus.PENDING,
                transactionId,
            },
        });

        // Create payment
        const payment = await tx.payment.create({
            data: {
                transactionId,
                amount: eventForUpdate.joiningFee,
                participantId: newParticipant.id,
                eventId,
                clientId: client.id,
                hostId: eventForUpdate.hostId,
                paymentStatus: PaymentStatus.PENDING,
            },
        });
        // Reserve seat: decrement capacity and set status to FULL when capacity reaches 0.
        const newCapacity = eventForUpdate.capacity - 1;
        if (newCapacity < 0) {
            throw new Error('No seats available');
        }

        const eventUpdateData: any = { capacity: newCapacity };
        if (newCapacity === 0) {
            eventUpdateData.status = EventStatus.FULL;
        }

        const updatedEvent = await tx.event.update({ where: { id: eventId }, data: eventUpdateData });

        const sslPayload: ISSLCommerz = {
            address: client.location,
            email: client.email,
            phoneNumber: client.contactNumber,
            name: client.name,
            amount: eventForUpdate.joiningFee,
            transactionId: transactionId
        }

        const sslPayment = await SSLService.sslPaymentInit(sslPayload)

        return {
            paymentUrl: sslPayment.GatewayPageURL,
            newParticipant,
            payment,
            updatedEvent
        };
    });

    return result;
};

// leave event
export const leaveEvent = async (eventId: string, user: any) => {
    const client = await prisma.client.findUnique({
        where: { email: user.email },
        include: { user: true },
    });

    if (!client) throw new Error("Client not found");

    if (client?.user.status === "SUSPENDED") throw new Error("Your account has been suspended. You cannot perform this operation.");

    if (client.isDeleted) throw new Error("Client account is deleted");
    if (client.user.status !== "ACTIVE") throw new Error("Client account is not active");
    // find in event participation
    const participation = await prisma.eventParticipant.findFirst({
        where: {
            eventId,
            clientId: client.id,
            participantStatus: { not: ParticipantStatus.LEFT },
        },
        include: {
            event: true,
            client: true
        },
    });
    if (!participation) throw new Error("You have not joined this event or already left");
    if (participation.event.date < new Date()) throw new Error("Event date has passed, you cannot leave now");
    // update participant status to LEFT
    // increase the seat capacity
    const result = await prisma.$transaction(async (tx) => {
        // mark participant as LEFT
        const updatedParticipation = await tx.eventParticipant.update({
            where: { id: participation.id },
            data: { participantStatus: ParticipantStatus.LEFT },
        });

        // reload event inside transaction to avoid race conditions
        const eventCurrent = await tx.event.findUnique({
            where: { id: participation.eventId },
            select: { capacity: true, status: true }
        });

        if (!eventCurrent) throw new Error('Event not found');

        // release reserved seat
        const eventUpdateData: any = { capacity: eventCurrent.capacity + 1 };

        // only change status to OPEN if it was FULL before releasing
        if (eventCurrent.status === EventStatus.FULL) {
            eventUpdateData.status = EventStatus.OPEN;
        }

        const updatedEvent = await tx.event.update({
            where: { id: participation.eventId },
            data: eventUpdateData,
        });

        return { updatedParticipation, updatedEvent };
    });
    return result;
}
// mark event as COMPLETED (only allowed when status is OPEN or FULL and event date/time has passed)
export const completeEvent = async (eventId: string, user: any) => {

    const userInfo = await prisma.user.findUnique({
        where: { email: user.email }
    });


    if (!userInfo) throw new Error("User not found");

    if(userInfo?.status === "SUSPENDED") throw new Error("Your account has been suspended. You cannot perform this operation.");

    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { host: true } });
    if (!event) throw new Error('Event not found');

    // Only allow completion when status is OPEN or FULL
    if (!(event.status === EventStatus.OPEN || event.status === EventStatus.FULL)) {
        throw new Error('Event cannot be marked completed unless it is OPEN or FULL');
    }

    const now = new Date();
    // Do not allow marking completed before the event date/time
    if (now.getTime() < new Date(event.date).getTime()) {
        throw new Error('Event date/time has not occurred yet');
    }

    // Permission: allow ADMIN or the host who owns the event
    if (user && user.role !== 'ADMIN') {
        if (user.role === 'HOST') {
            // verify host identity by email
            const host = await prisma.host.findUnique({ where: { email: user.email } });
            if (!host || host.id !== event.hostId) {
                throw new Error('You are not authorized to complete this event');
            }
        } else {
            throw new Error('You are not authorized to complete this event');
        }
    }

    const updated = await prisma.event.update({ where: { id: eventId }, data: { status: EventStatus.COMPLETED } });

    return updated;
}


const getRecentEvents = async () => {
    const now = new Date();

    const result = await prisma.event.findMany({
        where: {
            status: EventStatus.OPEN,
            date: { gte: now }
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
            host: { select: { id: true, name: true, email: true, profilePhoto: true, rating: true } }
        }
    });

    return result;
};

export const eventService = {
    getAllEvents,
    getSingleEvent,
    joinEvent,
    leaveEvent,
    getMyEvents,
    completeEvent,
    getEventsParticipants,
    getRecentEvents
};