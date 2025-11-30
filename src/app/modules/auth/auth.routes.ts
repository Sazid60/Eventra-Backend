
import express from 'express';
import auth from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimiter';
import { AuthController } from './auth.controller';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
    '/login',
    authLimiter,
    AuthController.loginUser
);

router.post(
    '/refresh-token',
    AuthController.refreshToken
)

router.post(
    '/change-password',
    auth(UserRole.ADMIN, UserRole.CLIENT, UserRole.HOST),
    AuthController.changePassword
);

router.post(
    '/forgot-password',
    AuthController.forgotPassword
);

router.post(
    '/reset-password',
    auth(UserRole.ADMIN, UserRole.CLIENT, UserRole.HOST),
    AuthController.resetPassword
)

router.get(
    '/me',
    auth(UserRole.ADMIN, UserRole.CLIENT, UserRole.HOST),
    AuthController.getMe
)
router.post(
    '/apply-host',
    auth(UserRole.CLIENT),
    AuthController.applyHost
)
export const AuthRoutes = router;