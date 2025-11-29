import { UserRole } from '@prisma/client';
import express, { NextFunction, Request, Response } from 'express';
import { fileUploader } from '../../../helpers/fileUploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { userValidation } from './user.validation';
import { userController } from './user.controller';


const router = express.Router();

router.get(
    '/',
    auth(UserRole.ADMIN),
    userController.getAllFromDB
);

router.get(
    '/me',
    auth( UserRole.ADMIN, UserRole.CLIENT),
    userController.getMyProfile
)

router.post(
    "/create-admin",
    auth( UserRole.ADMIN),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data))
        return userController.createAdmin(req, res, next)
    }
);


// dummy
router.post(
    "/create-client",
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = userValidation.createClient.parse(JSON.parse(req.body.data))
        return userController.createClient(req, res, next)
    }
);

router.patch(
    '/:id/status',
    auth( UserRole.ADMIN),
    validateRequest(userValidation.updateStatus),
    userController.changeProfileStatus
);

router.patch(
    "/update-my-profile",
    auth( UserRole.ADMIN, UserRole.CLIENT),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = JSON.parse(req.body.data)
        return userController.updateMyProfile(req, res, next)
    }
);


export const userRoutes = router;