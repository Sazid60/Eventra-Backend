import { Gender, UserStatus } from "@prisma/client";
import { z } from "zod";

const createAdmin = z.object({
    password: z.string({
        error: "Password is required",
    }),
    admin: z.object({
        name: z.string({
            error: "Name is required!",
        }),
        email: z.string({
            error: "Email is required!",
        }),
        contactNumber: z.string({
            error: "Contact Number is required!",
        }),
    }),
});



const InterestEnum = z.enum([
    "MUSIC", "SPORTS", "HIKING", "TRAVEL", "COOKING", "READING", "DANCING",
    "GAMING", "TECHNOLOGY", "PHOTOGRAPHY", "ART", "MOVIES", "FITNESS", "YOGA",
    "CYCLING", "RUNNING", "CAMPING", "FISHING", "LANGUAGES", "FOOD",
    "VOLUNTEERING", "GARDENING", "WRITING", "FASHION", "BUSINESS", "FINANCE",
    "MEDITATION", "DIY", "PETS", "SOCIALIZING", "OTHER",
]);

export const createClient = z.object({
    password: z.string({
        error: "Password is required",
    }),

    client: z.object({
        name: z.string({
            error: "Name is required!",
        }),

        email: z.string({
            error: "Email is required!",
        }),
        bio: z.string({
            error: "Bio is required!",
        }),

        contactNumber: z.string({
            error: "Contact Number is required!",
        }),

        location: z.string({
            error: "Location is required!",
        }),

        interests: z
            .array(InterestEnum, {
                error: "Interests are required!",
            })
            .nonempty("At least one interest is required!"),
    }),
});




const updateStatus = z.object({
    body: z.object({
        status: z.enum([UserStatus.ACTIVE, UserStatus.PENDING, UserStatus.DELETED, UserStatus.SUSPENDED]),
    }),
});

export const userValidation = {
    createAdmin,
    createClient,
    updateStatus,
};