
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../../shared/prisma";
import { EventStatus, HostApplicationStatus, PaymentStatus, UserRole } from "@prisma/client";

const fetchDashboardMetaData = async (user: JwtPayload) => {
    const payload: any = user as any;

    if (!payload || !payload.role) {
        throw new Error("Invalid user payload");
    }

    // ADMIN dashboard
    if (payload.role === UserRole.ADMIN) {
        const [
            totalUsers,
            totalAdmins,
            totalClients,
            totalEvents,
            totalCompletedEvents,
            totalRejectedEvents,
            paymentsSumRes,
            adminIncomeRes,
            pendingHostApplications,
            pendingEventApplications
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: UserRole.ADMIN } }),
            prisma.user.count({ where: { role: UserRole.CLIENT } }),
            prisma.event.count(),
            prisma.event.count({ where: { status: EventStatus.COMPLETED } }),
            prisma.event.count({ where: { status: EventStatus.REJECTED } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { paymentStatus: PaymentStatus.PAID } }),
            prisma.admin.aggregate({ _sum: { income: true } }),
            prisma.hostApplication.count({ where: { status: HostApplicationStatus.PENDING } }),
            prisma.event.count({ where: { status: EventStatus.PENDING } })
        ] as any);

        const totalPaymentsIncome = Number(paymentsSumRes._sum?.amount || 0);
        const totalAdminIncome = Number(adminIncomeRes._sum?.income || 0);

        return {
            role: UserRole.ADMIN,
            totalUsers,
            totalAdmins,
            totalClients,
            totalEvents,
            totalCompletedEvents,
            totalRejectedEvents,
            totalPaymentsIncome,
            totalAdminIncome,
            pendingHostApplications,
            pendingEventApplications
        };
    }

    // HOST dashboard
    if (payload.role === UserRole.HOST) {
        if (!payload.email) throw new Error("Host email missing in token");

        const host = await prisma.host.findUnique({ where: { email: payload.email } });
        if (!host) throw new Error("Host profile not found");

        const [
            totalEvents,
            totalCompletedEvents,
            totalRejectedEvents,
            totalPendingEvents,
            paymentsSumRes
        ] = await Promise.all([
            prisma.event.count({ where: { hostId: host.id } }),
            prisma.event.count({ where: { hostId: host.id, status: EventStatus.COMPLETED } }),
            prisma.event.count({ where: { hostId: host.id, status: EventStatus.REJECTED } }),
            prisma.event.count({ where: { hostId: host.id, status: EventStatus.PENDING } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { hostId: host.id, paymentStatus: PaymentStatus.PAID } })
        ] as any);

        const totalPaymentsIncome = Number(paymentsSumRes._sum?.amount || 0);

        return {
            role: UserRole.HOST,
            hostId: host.id,
            hostName: host.name,
            totalEvents,
            totalCompletedEvents,
            totalRejectedEvents,
            totalPendingEvents,
            totalPaymentsIncome,
            hostIncome: Number(host.income || 0),
            hostRating: Number(host.rating || 0),
            hostRatingCount: host.ratingCount || 0
        };
    }

    throw new Error("Dashboard not available for this user role");
};

export const MetaService = {
    fetchDashboardMetaData
};