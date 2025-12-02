
import z from "zod";

const EventCategoryEnum = z.enum([
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


const createEvent = z.object({
    title: z.string({
        error: "Title is required!",
    }),

    category: z.array(EventCategoryEnum, {
        error: "Event categories are required!",
    }).nonempty("At least one event category is required!"),

    description: z.string({
        error: "Description is required!",
    }),

    date: z.coerce.date({
        error: "Valid event date is required!",
    }),

    location: z.string({
        error: "Location is required!",
    }),

    joiningFee: z.number({
        error: "Joining fee is required!",
    }),

    capacity: z.number({
        error: "Event capacity is required!",
    })
});


const updateEvent = z.object({
    title: z.string().optional(),
    category: z.array(EventCategoryEnum).optional().refine((val) => {
        return typeof val === 'undefined' || (Array.isArray(val) && val.length > 0)}, { message: 'At least one event category is required!' }),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    location: z.string().optional(),
    joiningFee: z.number().optional(),
    image: z.string().optional(),
    capacity: z.number().optional(),
});

export const hostValidation = {
    createEvent,
    updateEvent,
};
