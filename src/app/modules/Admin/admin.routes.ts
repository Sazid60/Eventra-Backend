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

router.get(
    '/',
    auth(UserRole.ADMIN),
    AdminController.getAllFromDB
);

router.get(
    '/:id',
    auth( UserRole.ADMIN),
    AdminController.getByIdFromDB
);

router.patch(
    '/:id',
    auth(UserRole.ADMIN),
    validateRequest(adminValidationSchemas.update),
    AdminController.updateIntoDB
);

router.delete(
    '/:id',
    auth( UserRole.ADMIN),
    AdminController.deleteFromDB
);



export const AdminRoutes = router;