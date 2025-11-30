import express, { NextFunction, Request, Response } from 'express';
import { AdminController } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import { adminValidationSchemas } from './admin.validations';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';



const router = express.Router();

// get all host application 
router.get(
    '/host-applications',
    auth(UserRole.ADMIN),
    AdminController.getAllHostApplications
);

// approve host application
router.patch(
    '/host-applications/:id/approve',
    auth(UserRole.ADMIN),
    AdminController.approveHost
);

// reject host application
router.patch(
    '/host-applications/:id/reject',
    auth(UserRole.ADMIN),
    AdminController.rejectHost
);



router.patch(
    '/:id',
    auth(UserRole.ADMIN),
    validateRequest(adminValidationSchemas.update),
    AdminController.updateIntoDB
);





export const AdminRoutes = router;