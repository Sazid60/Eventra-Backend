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


//get all event applications 
router.get(
    '/event-applications',
    auth(UserRole.ADMIN),
    AdminController.getAllEventApplications
);

// get all Clients
router.get(
    '/clients',
    auth(UserRole.ADMIN),
    AdminController.getAllClients
);

// get all hosts 

router.get(
    '/hosts',
    auth(UserRole.ADMIN),
    AdminController.getAllHosts
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


// approve event

router.patch(
    '/event-application/:id/approve',
    auth(UserRole.ADMIN),
    AdminController.approveEventIntoDB
);


// reject event 
router.patch(
    '/event-application/:id/reject',
    auth(UserRole.ADMIN),
    AdminController.rejectEvent
);






export const AdminRoutes = router;