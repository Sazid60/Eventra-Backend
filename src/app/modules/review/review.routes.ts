import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from '../../middlewares/validateRequest';
import { reviewValidation } from './review.validation';
import { reviewController } from './review.controller';

const router = express.Router();

// Create review by transactionId passed as URL param
router.post(
    '/:transactionId',
    auth(UserRole.CLIENT),
    validateRequest(reviewValidation.createReview),
    reviewController.createReview
);

export const ReviewRoutes = router;