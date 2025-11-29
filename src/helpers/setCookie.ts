import type { Response } from "express";
interface AuthToken {
    accessToken?: string,
    refreshToken?: string
    accessTokenMaxAge?: number,
    refreshTokenMaxAge?: number
}
export const setAuthCookie = (res: Response, tokenInfo: AuthToken) => {
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken,
            {
                httpOnly: true,
                secure : true, 
                sameSite : "none", 
                maxAge: tokenInfo.accessTokenMaxAge || 1000 * 60 * 60
            }
        )
    }
    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken,
            {
                httpOnly: true,
                secure : true,
                sameSite : "none", 
                maxAge: tokenInfo.refreshTokenMaxAge || 1000 * 60 * 60 * 24 * 90
            }
        )
    }
}