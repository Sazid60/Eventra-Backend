
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



export const EventRoutes = router;
