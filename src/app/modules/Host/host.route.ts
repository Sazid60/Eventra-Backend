
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


router.delete(
    '/event/:id',
    auth(UserRole.HOST),
    hostController.deleteEvent
);



export const HostRoutes = router;
