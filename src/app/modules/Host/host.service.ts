import { Event, EventStatus } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import * as bcrypt from 'bcryptjs';
import { Request } from "express";
import { Secret } from "jsonwebtoken";
import { jwtHelper } from "../../../helpers/jwtHelper";

const createEvent = async (req: Request): Promise<Event> => {
    const file = req.file;

    const accessToken = req.cookies["accessToken"]
    console.log(accessToken)

    const decodedData = jwtHelper.verifyToken(
        accessToken,
        config.jwt.jwt_secret as Secret
    );

    let uploadedPublicId: string | undefined;
    if (file) {
        const uploadedProfileImage = await fileUploader.uploadToCloudinary(file);
        req.body.image = uploadedProfileImage?.secure_url;
        uploadedPublicId = (uploadedProfileImage as any)?.public_id;
    }

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id: decodedData.userId
        },
        include: {
            host: true
        }
    });

    if (!userData || !userData.host) {
        throw new Error("User not found");
    }


    try {
        const result = await prisma.$transaction(async (transactionClient) => {
            const createdEventData = await transactionClient.event.create({
                data: {
                    ...req.body,
                    hostId: userData.host?.id,
                }
            });

            return createdEventData;
        });

        return result;


    } catch (error) {
        if (uploadedPublicId) {
            await fileUploader.deleteFromCloudinary(uploadedPublicId as string);
        }
        throw error;
    }
};

const deleteEvent = async (id: string): Promise<Event> => {
    const isEventExist = await prisma.event.findUnique({
        where: { id }
    });
    if (!isEventExist) {
        throw new Error("Event not found!");
    }

    if (
        isEventExist.status !== EventStatus.CANCELLED &&
        isEventExist.status !== EventStatus.REJECTED &&
        isEventExist.status !== EventStatus.PENDING
    ) {
        throw new Error("Only PENDING, CANCELLED or REJECTED events can be deleted.");
    }

    const result = await prisma.event.delete({
        where: { id }
    });
    return result;
}
const updateEvent = async (id: string, req: Request): Promise<Event> => {
    const existingEvent = await prisma.event.findUnique({
        where: { id }
    });

    if (!existingEvent) {
        throw new Error("Event not found!");
    }

    if (
        existingEvent.status === EventStatus.CANCELLED ||
        existingEvent.status === EventStatus.REJECTED ||
        existingEvent.status === EventStatus.COMPLETED
    ) {
        throw new Error("Only Pending, Open or Full events can be updated.");
    }

    const updateData: any = { ...req.body };


    console.log(updateData)

    if (req.body.category) {
        if (req.body.category.length === 0) {
            updateData.category = existingEvent.category;
        } else {
            const merged = Array.from(
                new Set([...existingEvent.category, ...req.body.category])
            );

            updateData.category = merged;
        }
    }


    const file = req.file;
    let uploadedPublicId: string | undefined;
    if (file) {
        const uploadedProfileImage = await fileUploader.uploadToCloudinary(file);
        req.body.image = uploadedProfileImage?.secure_url;
        uploadedPublicId = (uploadedProfileImage as any)?.public_id;
    }

    try {
        return await prisma.event.update({
            where: { id },
            data: updateData
        });
    } catch (error) {
        if (uploadedPublicId) {
            await fileUploader.deleteFromCloudinary(uploadedPublicId);
        }
        throw error;
    }
};



export const hostService = {
    createEvent,
    deleteEvent,
    updateEvent
};