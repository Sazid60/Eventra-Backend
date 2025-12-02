
import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { eventController } from './event.controller';



const router = express.Router();



// get my events 
router.get(
    '/all-events',
    eventController.getAllEvents
);

// get single event
router.get(
    '/:id',
    auth(UserRole.HOST, UserRole.ADMIN, UserRole.CLIENT),
    eventController.getSingleEvent
);

// join event 
router.post(
    '/join/:id',
    auth(UserRole.CLIENT),
    eventController.joinEvent
);

// leave events 
router.post(
    '/leave/:id',
    auth(UserRole.CLIENT),
    eventController.leaveEvent
);



export const EventRoutes = router;
