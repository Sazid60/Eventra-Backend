import { z } from "zod";

const createReview = z.object({
    body: z.object({
        rating: z.number({error: 'Rating is required' }).int().min(1).max(5),
        comment: z.string(),
    })
});

export const reviewValidation = {
    createReview,
};
