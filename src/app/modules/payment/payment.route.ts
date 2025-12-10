import express from "express";
import { PaymentController } from "./payment.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/success", PaymentController.successPayment);
router.post("/fail", PaymentController.failPayment);
router.post("/cancel", PaymentController.cancelPayment);
router.post("/validate-payment", PaymentController.validatePayment);

// Get user-specific payments (Admin & Host only)
router.get(
    "/",
    auth(UserRole.ADMIN, UserRole.HOST),
    PaymentController.getUserPayments
);

export const PaymentRoutes = router;