
import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpers/fileUploader';
import { hostValidation } from './host.validation';
import { hostController } from './host.controller';



const router = express.Router();

router.post(
    '/create-event',
    auth(UserRole.HOST),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = hostValidation.createEvent.parse(JSON.parse(req.body.data))
        return hostController.createEvent(req, res, next)
    }
);

// get my events 
router.get(
    '/my-hosted-events',
    auth(UserRole.HOST),
    hostController.getMyEvents
);

// update event 

router.patch(
    '/event/:id',
    auth(UserRole.HOST),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = hostValidation.updateEvent.parse(JSON.parse(req.body.data))
        console.log(req.body)
        return hostController.updateEvent(req, res, next)
    }
);

// mark the event completed 
router.patch(
    '/event-complete/:id',
    auth(UserRole.HOST),
    hostController.completeEvent
);

router.delete(
    '/event/:id',
    auth(UserRole.HOST),
    hostController.deleteEvent
);

// event status update route 

router.patch(
    '/event/:id/cancel',
    auth(UserRole.HOST),
    hostController.cancelEvent
);




export const HostRoutes = router;
