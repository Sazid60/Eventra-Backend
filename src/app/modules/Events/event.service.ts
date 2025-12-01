import { Event, EventCategory, EventStatus, ParticipantStatus, PaymentStatus, Prisma } from "@prisma/client";
import config from "../../../config";
import prisma from "../../../shared/prisma";

import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { eventSearchableFields } from "../Admin/admin.constant";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";


const getTransactionId = () => {
    return `tran_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

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


    if (user && user.role !== "ADMIN") {
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

            for (const ev of events) {
                const match = ev.category.some(c =>
                    userInterests.includes(c as any)
                );

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


// get single event
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

// join event 

export const joinEvent = async (eventId: string, user: any) => {
    const client = await prisma.client.findUnique({
        where: { email: user.email },
        include: { user: true },
    });

    if (!client) throw new Error("Client not found");
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

        // Decrement capacity and set status to FULL if needed
        let updatedEventData: any = {
            capacity: { decrement: 1 },
        };

        if (eventForUpdate.capacity === 1) {
            updatedEventData.status = EventStatus.FULL;
        }

        const updatedEvent = await tx.event.update({
            where: { id: eventId },
            data: updatedEventData,
        });

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

export const eventService = {
    getAllEvents,
    getSingleEvent,
    joinEvent
};