// =============================================================================
// Auth Types — Request / Response DTOs
// =============================================================================

import type { BaseEntity } from './common.js';

/** Register request body */
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

/** Login request body */
export interface LoginRequest {
    email: string;
    password: string;
}

/** Token refresh request body */
export interface RefreshTokenRequest {
    refreshToken: string;
}

/** Auth tokens returned on login / register / refresh */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/** Public user profile */
export interface UserDTO extends BaseEntity {
    email: string;
    name: string;
    avatarUrl: string | null;
}

/** Login / register response */
export interface AuthResponse {
    user: UserDTO;
    tokens: AuthTokens;
}
