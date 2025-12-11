// const successPayment = async (query: Record<string, string>) => {
//     // 1.update payment status to PAID
//     // 2.update event participant status to CONFIRMED
//     // 3.return success true
//     // 4. distribute the income in admin and host 90% 10%
//     return { success: true };

// };
// const failPayment = async (query: Record<string, string>) => {
//     // 1.update payment status to FAILED delete payment record
//     // 2.update event participant status to LEFT delete participant record
//     // 3. update event capacity +1
//     // 4. if event status is full change to OPEN
//     // 3.return success true
//     return { success: true };
// }
// const cancelPayment = async (query: Record<string, string>) => {
//     // 1.update payment status to FAILED delete payment record
//     // 2.update event participant status to LEFT delete participant record
//     // 3. update event capacity +1
//     // 4. if event status is full change to OPEN
//     // 3.return success true
//     return { success: true };
// };
// export const paymentServices = {
//     successPayment,
//     failPayment,
//     cancelPayment,
// }

import prisma from "../../../shared/prisma";
import { PaymentStatus, ParticipantStatus, EventStatus, UserRole, Prisma } from "@prisma/client";
import { sendEmail } from "../../../helpers/sendEmail";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";


const successPayment = async (query: Record<string, string>) => {
    try {

        console.log("=== PAYMENT SUCCESS CALLBACK ===");
        console.log("Full query object:", JSON.stringify(query));


        const transactionId = query.transactionId || query.tran_id || query.txnId || query.transaction_id;
        console.log("Extracted transactionId:", transactionId);

        if (!transactionId) {
            console.error("ERROR: No transactionId found in query");
            throw new Error("transactionId is required in payment callback");
        }


        const payment = await prisma.payment.findUnique({
            where: { transactionId },
            select: {
                id: true,
                transactionId: true,
                amount: true,
                paymentStatus: true,
                participantId: true,
                hostId: true,
                createdAt: true,
                invoiceUrl: true,
                event: {
                    select: {
                        id: true,
                        title: true,
                        date: true,
                        location: true,
                        joiningFee: true,
                        host: { select: { name: true, email: true } }
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        contactNumber: true
                    }
                }
            }
        });

        if (!payment) {
            console.error("ERROR: Payment not found for transactionId:", transactionId);
            throw new Error("Payment not found for transactionId: " + transactionId);
        }

        console.log("Payment found. Current status:", payment.paymentStatus);


        if (payment.paymentStatus === PaymentStatus.PAID) {
            console.log("Payment already processed, skipping");
            return { success: true, message: 'Payment already processed', payment };
        }


        console.log("Starting transaction...");
        const result = await prisma.$transaction(async (tx) => {

            console.log("Updating payment to PAID...");
            const updatedPayment = await tx.payment.update({
                where: { id: payment.id },
                data: { paymentStatus: PaymentStatus.PAID }
            });
            console.log("Payment updated successfully");


            console.log("Updating participant to CONFIRMED with transactionId:", transactionId);
            const updatedParticipant = await tx.eventParticipant.update({
                where: { transactionId },
                data: { participantStatus: ParticipantStatus.CONFIRMED }
            });
            console.log("Participant updated successfully:", updatedParticipant.id);

            const host = await tx.host.findUnique({ where: { id: payment.hostId } });
            if (host) {
                const hostShare = Number((payment.amount * 0.9).toFixed(2));
                await tx.host.update({ where: { id: host.id }, data: { income: { increment: hostShare } as any } });
            }

            const admin = await tx.admin.findFirst();
            if (admin) {
                const adminShare = Number((payment.amount * 0.1).toFixed(2));
                await tx.admin.update({ where: { id: admin.id }, data: { income: { increment: adminShare } as any } });
            }

            return { success: true, payment: updatedPayment, participant: updatedParticipant };
        });
        try {
            const updatedPayment = (result as any).payment;
            const client = (payment as any).client;
            const event = (payment as any).event;
            const host = event?.host;

            if (client && client.email) {
                const invoiceDate = updatedPayment?.createdAt ? new Date(updatedPayment.createdAt).toLocaleString() : new Date().toLocaleString();

                const templateData = {
                    invoiceNumber: updatedPayment?.transactionId || transactionId,
                    invoiceDate,
                    transactionId: updatedPayment?.transactionId || transactionId,
                    amount: updatedPayment?.amount || (payment as any).amount || 0,
                    invoiceUrl: updatedPayment?.invoiceUrl || (payment as any).invoiceUrl || null,
                    client: { name: client.name || '', email: client.email || '', contactNumber: client.contactNumber || '' },
                    event: { title: event?.title || '', dateReadable: event?.date ? new Date(event.date).toLocaleString() : '', location: event?.location || '' },
                    host: { name: host?.name || '', email: host?.email || '' },
                };

                try {
                    await sendEmail({
                        to: client.email,
                        subject: `Your Invoice for ${templateData.event.title || 'Event'}`,
                        templateName: 'invoice-payment',
                        templateData,
                    });
                } catch (err: any) {
                    console.log('Failed to send invoice email:', err?.message || err);
                }
            }
        } catch (err: any) {
            console.log('Invoice email creation error', err?.message || err);
        }

        return result;

    } catch (error: any) {
        throw error;
    }
};

const failPayment = async (query: Record<string, string>) => {
    const transactionId = query.transactionId || query.txnId || query.transaction_id;
    if (!transactionId) throw new Error("transactionId is required");

    const payment = await prisma.payment.findUnique({ where: { transactionId } });
    if (!payment) throw new Error("Payment not found");

    if (payment.paymentStatus === PaymentStatus.CANCELLED || payment.paymentStatus === PaymentStatus.REFUNDED) {
        return { success: true, message: 'Payment already cancelled', payment };
    }

    const result = await prisma.$transaction(async (tx) => {

        const updatedPayment = await tx.payment.update({ where: { id: payment.id }, data: { paymentStatus: PaymentStatus.CANCELLED } });


        if (payment.participantId) {
            const participant = await tx.eventParticipant.findUnique({ where: { id: payment.participantId }, select: { id: true, participantStatus: true, eventId: true } });
            if (participant && participant.participantStatus !== ParticipantStatus.LEFT) {
                await tx.eventParticipant.update({ where: { id: participant.id }, data: { participantStatus: ParticipantStatus.LEFT } });


                const event = await tx.event.findUnique({ where: { id: participant.eventId }, select: { id: true, capacity: true, status: true } });
                if (event) {
                    await tx.event.update({ where: { id: event.id }, data: { capacity: event.capacity + 1 } });

                    if (event.status === EventStatus.FULL) {
                        await tx.event.update({ where: { id: event.id }, data: { status: EventStatus.OPEN } });
                    }
                }
            }
        }

        return { success: true, payment: updatedPayment };
    });

    return result;
}


const cancelPayment = async (query: Record<string, string>) => {

    const transactionId = query.transactionId || query.txnId || query.transaction_id;
    if (!transactionId) throw new Error("transactionId is required");

    const payment = await prisma.payment.findUnique({ where: { transactionId } });
    if (!payment) throw new Error("Payment not found");


    if (payment.paymentStatus === PaymentStatus.CANCELLED || payment.paymentStatus === PaymentStatus.REFUNDED) {
        return { success: true, message: 'Payment already cancelled', payment };
    }

    const result = await prisma.$transaction(async (tx) => {

        const updatedPayment = await tx.payment.update({ where: { id: payment.id }, data: { paymentStatus: PaymentStatus.CANCELLED } });


        if (payment.participantId) {
            const participant = await tx.eventParticipant.findUnique({ where: { id: payment.participantId }, select: { id: true, participantStatus: true, eventId: true } });
            if (participant && participant.participantStatus !== ParticipantStatus.LEFT) {
                await tx.eventParticipant.update({ where: { id: participant.id }, data: { participantStatus: ParticipantStatus.LEFT } });

                const event = await tx.event.findUnique({ where: { id: participant.eventId }, select: { id: true, capacity: true, status: true } });
                if (event) {
                    await tx.event.update({ where: { id: event.id }, data: { capacity: event.capacity + 1 } });
                    if (event.status === EventStatus.FULL) {
                        await tx.event.update({ where: { id: event.id }, data: { status: EventStatus.OPEN } });
                    }
                }
            }
        }

        return { success: true, payment: updatedPayment };
    });

    return result;
};


const getUserPayments = async (params: any, options: IPaginationOptions, user: any) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, paymentStatus, ...filterData } = params;

    const andConditions: Prisma.PaymentWhereInput[] = [];


    if (user.role === UserRole.HOST) {
        const host = await prisma.host.findUnique({
            where: { email: user.email },
            select: { id: true }
        });

        if (!host) throw new Error("Host profile not found");

        andConditions.push({
            hostId: host.id
        });
    }

    if (searchTerm) {
        andConditions.push({
            OR: [
                { transactionId: { contains: searchTerm, mode: 'insensitive' } },
                { client: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        });
    }

    if (paymentStatus) {
        andConditions.push({ paymentStatus: paymentStatus as PaymentStatus });
    }


    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: { equals: (filterData as any)[key] }
            }))
        });
    }

    const whereConditions: Prisma.PaymentWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.payment.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: 'desc' },
        include: {
            event: { select: { id: true, title: true, date: true } },
            client: { select: { id: true, name: true, email: true } }
        }
    });

    const total = await prisma.payment.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        data: result
    };
};

export const paymentServices = {
    successPayment,
    failPayment,
    cancelPayment,
    getUserPayments
};