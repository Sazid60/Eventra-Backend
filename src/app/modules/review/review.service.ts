import prisma from "../../../shared/prisma";
import { PaymentStatus } from "@prisma/client";

interface CreateReviewPayload {
    rating: number;
    comment?: string | null;
}

const createReview = async (transactionId: string, user: any, payload: CreateReviewPayload) => {
    if (!transactionId) throw new Error('transactionId is required');


    const payment = await prisma.payment.findUnique(
        {
            where: { transactionId },
            include: {
                event: {
                    include: {
                        host: true
                    }
                }
            }
        });
    if (!payment) throw new Error('Payment not found');

    if (payment.event.status !== 'COMPLETED') {
        throw new Error('Cannot review: event not completed yet');
    }


    if (payment.paymentStatus !== PaymentStatus.PAID) {
        throw new Error('Cannot review: payment not completed');
    }

    console.log(user)
    const client = await prisma.client.findUnique({
        where: { email: user.email }
    })

    if (!client) {
        throw new Error("Client Info not found");
    }

    const userInfo = await prisma.user.findUnique({
        where: { email: user.email }
    });

    if (userInfo?.status === "SUSPENDED") throw new Error("Your account has been suspended. You cannot perform this operation.");



    if (!user || !client.id) throw new Error('Unauthorized');



    if (payment.clientId !== client.id) throw new Error('You can only review events you purchased');

    const eventId = payment.eventId;
    const hostId = payment.hostId;

  
    const existing = await prisma.review.findFirst({ where: { eventId, clientId: client.id } });
    if (existing) throw new Error('You have already reviewed this event');




    const result = await prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
            data: {
                rating: payload.rating,
                comment: payload.comment || null,
                transactionId: payment.transactionId,
                eventId,
                clientId: client.id,
                hostId: hostId,
            }
        });


        if (hostId) {
            const host = await tx.host.findUnique({ where: { id: hostId }, select: { id: true, rating: true, ratingCount: true } });
            if (host) {
                const previousTotal = (host.rating || 0) * (host.ratingCount || 0);
                const newCount = (host.ratingCount || 0) + 1;
                const newRating = (previousTotal + payload.rating) / newCount;

                await tx.host.update({ where: { id: host.id }, data: { rating: Number(newRating.toFixed(2)), ratingCount: newCount } });
            }
        }

        return review;
    });

    return result;
}


const getLatestReviews = async () => {
    const result = await prisma.review.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
            client: { select: { id: true, name: true, email: true, profilePhoto: true } },
            event: { select: { id: true, title: true } }
        }
    });

    return result;
};


const checkReviewExists = async (transactionId: string) => {
    if (!transactionId) throw new Error('transactionId is required');

    const review = await prisma.review.findFirst({
        where: { transactionId }
    });

    return {
        hasReviewed: !!review,
        review: review || null
    };
};

export const reviewService = {
    createReview,
    getLatestReviews,
    checkReviewExists
};
