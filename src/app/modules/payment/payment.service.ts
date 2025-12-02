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
import { PaymentStatus, ParticipantStatus, EventStatus } from "@prisma/client";
import { sendEmail } from "../../../helpers/sendEmail";

// Handle successful payment callback
const successPayment = async (query: Record<string, string>) => {
    const transactionId = query.transactionId
    if (!transactionId) throw new Error("transactionId is required");

    const payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: {
            event: { select: { id: true, title: true, date: true, location: true, joiningFee: true, host: { select: { name: true, email: true } } } },
            client: { select: { id: true, name: true, email: true, contactNumber: true } }
        }
    });
    if (!payment) throw new Error("Payment not found");

    // Idempotency: if already processed as PAID, return immediately
    if (payment.paymentStatus === PaymentStatus.PAID) {
        return { success: true, message: 'Payment already processed', payment };
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Mark payment as PAID
        const updatedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: { paymentStatus: PaymentStatus.PAID }
        });

        // 2. Update participant status to CONFIRMED
        let updatedParticipant = null;
        if (payment.participantId) {
            updatedParticipant = await tx.eventParticipant.update({
                where: { id: payment.participantId },
                data: { participantStatus: ParticipantStatus.CONFIRMED }
            });
        }

        // 3. Distribute income: 90% host, 10% admin (add to host.income and admin.income)
        // find host and update income
        const host = await tx.host.findUnique({ where: { id: payment.hostId } });
        if (host) {
            const hostShare = Number((payment.amount * 0.9).toFixed(2));
            await tx.host.update({ where: { id: host.id }, data: { income: { increment: hostShare } as any } });
        }

        // credit admin (pick first admin record)
        const admin = await tx.admin.findFirst();
        if (admin) {
            const adminShare = Number((payment.amount * 0.1).toFixed(2));
            await tx.admin.update({ where: { id: admin.id }, data: { income: { increment: adminShare } as any } });
        }

        //    send email will be done after transaction completes (below)

        return { success: true, payment: updatedPayment, participant: updatedParticipant };
    });

    // After successful DB transaction, render invoice and send email (outside transaction)
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

            // fire-and-forget: log errors but don't fail the payment flow
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
};

// Handle failed payment (e.g., declined)
const failPayment = async (query: Record<string, string>) => {
    const transactionId = query.transactionId || query.txnId || query.transaction_id;
    if (!transactionId) throw new Error("transactionId is required");

    const payment = await prisma.payment.findUnique({ where: { transactionId } });
    if (!payment) throw new Error("Payment not found");

    // Idempotency: if already cancelled/refunded, return
    if (payment.paymentStatus === PaymentStatus.CANCELLED || payment.paymentStatus === PaymentStatus.REFUNDED) {
        return { success: true, message: 'Payment already cancelled', payment };
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Mark payment as CANCELLED
        const updatedPayment = await tx.payment.update({ where: { id: payment.id }, data: { paymentStatus: PaymentStatus.CANCELLED } });

        // 2. Update participant status to LEFT (if exists) and release reserved seat
        if (payment.participantId) {
            const participant = await tx.eventParticipant.findUnique({ where: { id: payment.participantId }, select: { id: true, participantStatus: true, eventId: true } });
            if (participant && participant.participantStatus !== ParticipantStatus.LEFT) {
                await tx.eventParticipant.update({ where: { id: participant.id }, data: { participantStatus: ParticipantStatus.LEFT } });

                // 3. Increase event capacity by 1 (release reserved seat)
                const event = await tx.event.findUnique({ where: { id: participant.eventId }, select: { id: true, capacity: true, status: true } });
                if (event) {
                    await tx.event.update({ where: { id: event.id }, data: { capacity: event.capacity + 1 } });
                    // 4. if event status is FULL change to OPEN
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

// Handle cancelled/refunded payment by user
const cancelPayment = async (query: Record<string, string>) => {
    // Use same flow as failPayment but mark as CANCELLED (or REFUNDED if you prefer)
    const transactionId = query.transactionId || query.txnId || query.transaction_id;
    if (!transactionId) throw new Error("transactionId is required");

    const payment = await prisma.payment.findUnique({ where: { transactionId } });
    if (!payment) throw new Error("Payment not found");

    // Idempotency check
    if (payment.paymentStatus === PaymentStatus.CANCELLED || payment.paymentStatus === PaymentStatus.REFUNDED) {
        return { success: true, message: 'Payment already cancelled', payment };
    }

    const result = await prisma.$transaction(async (tx) => {
        // mark payment as CANCELLED (if refunded, use PaymentStatus.REFUNDED)
        const updatedPayment = await tx.payment.update({ where: { id: payment.id }, data: { paymentStatus: PaymentStatus.CANCELLED } });

        // update participant to LEFT and release reserved seat
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

export const paymentServices = {
    successPayment,
    failPayment,
    cancelPayment,
}