import express from 'express';
import { MetaController } from './meta.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Dashboard metadata (protected - Admin & Host only)
router.get(
    '/',
    auth(UserRole.ADMIN, UserRole.HOST),
    MetaController.fetchDashboardMetaData
);

// Landing page stats (public endpoint)
router.get(
    '/landing-page',
    MetaController.getLandingPageStats
);

export const MetaRoutes = router;