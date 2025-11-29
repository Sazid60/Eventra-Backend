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
const createClient = z.object({
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
        address: z.string({
            error: "Address is required!",
        }),
        contactNumber: z.string({
            error: "Contact Number is required!",
        }),
    }),
});



const updateStatus = z.object({
    body: z.object({
        status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.DELETED]),
    }),
});

export const userValidation = {
    createAdmin,
    createClient,
    updateStatus,
};