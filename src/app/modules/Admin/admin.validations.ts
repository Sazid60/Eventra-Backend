import { z } from "zod";

const update = z.object({
    body: z.object({
        name: z.string().optional(),
        contactNumber: z.string().optional()
    })
});


export const EventStatusSchema = z.enum([
  "PENDING",
  "REJECTED",
  "OPEN",
  "FULL",
  "COMPLETED",
  "CANCELLED",
]);

export const UpdateEventStatusSchema = z.object({
  status: EventStatusSchema, 
});


export const adminValidationSchemas = {
    update,
    UpdateEventStatusSchema
}