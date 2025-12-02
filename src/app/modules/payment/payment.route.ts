import express from "express";
import { PaymentController } from "./payment.controller";



const router = express.Router();


router.post("/success", PaymentController.successPayment);
router.post("/fail", PaymentController.failPayment);
router.post("/cancel", PaymentController.cancelPayment);
router.post("/validate-payment", PaymentController.validatePayment)

export const PaymentRoutes = router;