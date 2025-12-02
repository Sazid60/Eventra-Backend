import type { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

const generateToken = (payload: any, secret: any, expiresIn: string) => {
    const token = jwt.sign(payload, secret, {
        algorithm: "HS256",
        expiresIn
    }
    );

    return token;
}

const verifyToken = (token: string, secret: any) => {
    return jwt.verify(token, secret)
}

export const jwtHelper = {
    generateToken,
    verifyToken
}