import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { userRoutes } from '../modules/User/user.routes';
import { AdminRoutes } from '../modules/Admin/admin.routes';
import { HostRoutes } from '../modules/Host/host.route';
import { EventRoutes } from '../modules/Events/event.routes';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { ReviewRoutes } from '../modules/review/review.routes';


const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: AuthRoutes
    },
    {
        path: '/user',
        route: userRoutes
    },
    {
        path: '/admin',
        route: AdminRoutes
    },

    {
        path: '/host',
        route: HostRoutes
    },

    {
        path: '/event',
        route: EventRoutes
    },

    {
        path: '/payment',
        route: PaymentRoutes
    },
    {
        path: '/review',
        route: ReviewRoutes
    }

];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;