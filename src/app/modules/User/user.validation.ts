import { Gender, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";


const InterestEnum = z.enum([
    "MUSIC", "MOVIE", "THEATER", "COMEDY", "PARTY", "NIGHTLIFE",
    "CONCERT", "FESTIVAL",
    "SPORTS", "HIKING", "CYCLING", "RUNNING", "FITNESS",
    "CAMPING", "OUTDOOR", "ADVENTURE",
    "SOCIAL", "NETWORKING", "MEETUP", "COMMUNITY", "VOLUNTEERING",
    "CULTURE", "RELIGION",
    "FOOD", "DINNER", "COOKING", "TASTING", "CAFE", "RESTAURANT",
    "TECH", "WORKSHOP", "SEMINAR", "CONFERENCE", "EDUCATION",
    "LANGUAGE", "BUSINESS", "FINANCE",
    "ART", "CRAFT", "PHOTOGRAPHY", "PAINTING", "WRITING", "DANCE",
    "GAMING", "ESPORTS", "ONLINE_EVENT",
    "TRAVEL", "TOUR", "ROADTRIP",
    "OTHER",
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



// Shared fields across all roles
const sharedFields = {
    name: z.string().optional(),
    profilePhoto: z.string().url().optional(),
    contactNumber: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
};

// Admin update schema
const updateAdmin = z.object({
    role: z.literal(UserRole.ADMIN).optional(),
    admin: z.object({
        ...sharedFields,
    }).partial(),
});

// Client update schema
const updateClient = z.object({
    role: z.literal(UserRole.CLIENT).optional(),
    client: z.object({
        ...sharedFields,
        interests: z.array(InterestEnum).optional(),
    }).partial(),
});

// Host update schema
const updateHost = z.object({
    role: z.literal(UserRole.HOST).optional(),
    host: z.object({
        ...sharedFields,
    }).partial(),
});

// Unified update schema
 const updateProfile = z.union([updateAdmin, updateClient, updateHost]);

export const userValidation = {
    createClient,
    updateStatus,
    updateProfile
};