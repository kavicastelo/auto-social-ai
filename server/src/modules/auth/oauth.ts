import type { FastifyPluginAsync } from 'fastify';
import oauthPlugin from '@fastify/oauth2';
import { env } from '../../config/index.js';
import { prisma } from '../../database/index.js';
import { logger } from '../../utils/index.js';

export const setupOAuthProviders: FastifyPluginAsync = async (app) => {
    const serverUrl = env.SERVER_URL;
    const clientUrl = env.CLIENT_URL;

    // ── Twitter OAuth 2.0 ─────────────────────────────────────────────────────
    await app.register(oauthPlugin, {
        name: 'twitterOAuth2',
        credentials: {
            client: {
                id: env.TWITTER_CLIENT_ID || 'dummy_twitter_id',
                secret: env.TWITTER_CLIENT_SECRET || 'dummy_twitter_secret',
            },
            auth: {
                authorizeHost: 'https://twitter.com',
                authorizePath: '/i/oauth2/authorize',
                tokenHost: 'https://api.twitter.com',
                tokenPath: '/2/oauth2/token',
            },
        },
        startRedirectPath: '/login/twitter',
        callbackUri: `${serverUrl}/api/auth/callback/twitter`,
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        pkce: 'S256', // Twitter OAuth 2.0 requires S256 PKCE
    });

    // ── LinkedIn OAuth 2.0 ─────────────────────────────────────────────────────
    await app.register(oauthPlugin, {
        name: 'linkedinOAuth2',
        credentials: {
            client: {
                id: env.LINKEDIN_CLIENT_ID || 'dummy_linkedin_id',
                secret: env.LINKEDIN_CLIENT_SECRET || 'dummy_linkedin_secret',
            },
            auth: {
                authorizeHost: 'https://www.linkedin.com',
                authorizePath: '/oauth/v2/authorization',
                tokenHost: 'https://www.linkedin.com',
                tokenPath: '/oauth/v2/accessToken',
            },
        },
        startRedirectPath: '/login/linkedin',
        callbackUri: `${serverUrl}/api/auth/callback/linkedin`,
        scope: ['w_member_social', 'openid', 'profile', 'email'],
    });

    // ── Facebook OAuth 2.0 ─────────────────────────────────────────────────────
    await app.register(oauthPlugin, {
        name: 'facebookOAuth2',
        credentials: {
            client: {
                id: env.FACEBOOK_CLIENT_ID || 'dummy_facebook_id',
                secret: env.FACEBOOK_CLIENT_SECRET || 'dummy_facebook_secret',
            },
            auth: {
                authorizeHost: 'https://facebook.com',
                authorizePath: '/v12.0/dialog/oauth',
                tokenHost: 'https://graph.facebook.com',
                tokenPath: '/v12.0/oauth/access_token',
            },
        },
        startRedirectPath: '/login/facebook',
        callbackUri: `${serverUrl}/api/auth/callback/facebook`,
        scope: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'public_profile', 'email'],
    });

    // ── Instagram (via Facebook) OAuth 2.0 ─────────────────────────────────────
    // Instagram Graph API uses Facebook Login with specific scopes
    await app.register(oauthPlugin, {
        name: 'instagramOAuth2',
        credentials: {
            client: {
                id: env.INSTAGRAM_CLIENT_ID || env.FACEBOOK_CLIENT_ID || 'dummy_instagram_id',
                secret: env.INSTAGRAM_CLIENT_SECRET || env.FACEBOOK_CLIENT_SECRET || 'dummy_instagram_secret',
            },
            auth: {
                authorizeHost: 'https://facebook.com',
                authorizePath: '/v12.0/dialog/oauth',
                tokenHost: 'https://graph.facebook.com',
                tokenPath: '/v12.0/oauth/access_token',
            },
        },
        startRedirectPath: '/login/instagram',
        callbackUri: `${serverUrl}/api/auth/callback/instagram`,
        scope: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement', 'public_profile'],
    });

    // ── Google OAuth 2.0 ──────────────────────────────────────────────────────
    await app.register(oauthPlugin, {
        name: 'googleOAuth2',
        credentials: {
            client: {
                id: env.GOOGLE_CLIENT_ID || 'dummy_google_id',
                secret: env.GOOGLE_CLIENT_SECRET || 'dummy_google_secret',
            },
            auth: {
                authorizeHost: 'https://accounts.google.com',
                authorizePath: '/o/oauth2/v2/auth',
                tokenHost: 'https://oauth2.googleapis.com',
                tokenPath: '/token',
            },
        },
        startRedirectPath: '/login/google',
        callbackUri: `${serverUrl}/api/auth/callback/google`,
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.upload'],
    });

    // ── TikTok OAuth 2.0 ──────────────────────────────────────────────────────
    await app.register(oauthPlugin, {
        name: 'tiktokOAuth2',
        credentials: {
            client: {
                id: env.TIKTOK_CLIENT_ID || 'dummy_tiktok_id',
                secret: env.TIKTOK_CLIENT_SECRET || 'dummy_tiktok_secret',
            },
            auth: {
                authorizeHost: 'https://www.tiktok.com',
                authorizePath: '/auth/authorize/',
                tokenHost: 'https://open-api.tiktok.com',
                tokenPath: '/oauth/access_token/',
            },
        },
        startRedirectPath: '/login/tiktok',
        callbackUri: `${serverUrl}/api/auth/callback/tiktok`,
        scope: ['user.info.basic', 'video.upload', 'video.publish'],
    });

    // ── Callback Handlers ──────────────────────────────────────────────────────

    interface OAuthToken {
        access_token: string;
        refresh_token?: string;
        expires_at?: number | string | Date;
    }

    // Generic helper to handle social account creation
    const handleCallback = async (providerName: string, request: any, reply: any) => {
        try {
            const oauthProvider = (app as any)[providerName];
            if (!oauthProvider) {
                throw new Error(`OAuth provider ${providerName} not found`);
            }

            // Get tokens from the authorization code flow
            const { token } = await oauthProvider.getAccessTokenFromAuthorizationCodeFlow(request);
            const accessToken = (token as OAuthToken).access_token;
            const refreshToken = (token as OAuthToken).refresh_token;
            
            // Calculate expiry date if present
            let tokenExpiresAt: Date | null = null;
            if ((token as OAuthToken).expires_at) {
                tokenExpiresAt = new Date((token as OAuthToken).expires_at!);
            }

            // Extract platform name from provider (e.g., "twitterOAuth2" -> "twitter")
            const platform = providerName.replace('OAuth2', '').toLowerCase() as any;

            // In production, you would fetch profile info from the platform's API
            // Example: GET https://api.twitter.com/2/users/me
            // Example: GET https://graph.facebook.com/me?fields=id,name,picture
            
            // TODO: Implement actual profile fetching for each platform
            // For now, we use a deterministic stub for demonstration
            const platformUserId = `id_${Math.random().toString(36).substring(7)}`;
            const platformUsername = `${platform}_user_${Math.random().toString(36).substring(7)}`;
            const avatarUrl = null;

            // Extract workspaceId from state if passed, or default (better to get from session/JWT)
            const query = request.query as any;
            const workspaceId = query.state || 'default_workspace';

            await prisma.socialAccount.upsert({
                where: {
                    platform_platformUserId_workspaceId: {
                        platform,
                        platformUserId,
                        workspaceId,
                    }
                },
                update: {
                    accessToken,
                    refreshToken,
                    tokenExpiresAt,
                    status: 'connected',
                },
                create: {
                    platform,
                    platformUserId,
                    platformUsername,
                    accessToken,
                    refreshToken,
                    tokenExpiresAt,
                    avatarUrl,
                    workspaceId,
                    status: 'connected',
                }
            });

            logger.info(`Successfully connected ${platform} account for workspace ${workspaceId}`);
            reply.redirect(`${clientUrl}/pages?success=true&platform=${platform}`);
        } catch (err) {
            logger.error({ err }, `OAuth callback failed for ${providerName}`);
            reply.redirect(`${clientUrl}/pages?success=false&error=oauth_failed`);
        }
    };

    app.get('/callback/twitter', (req, rep) => handleCallback('twitterOAuth2', req, rep));
    app.get('/callback/linkedin', (req, rep) => handleCallback('linkedinOAuth2', req, rep));
    app.get('/callback/facebook', (req, rep) => handleCallback('facebookOAuth2', req, rep));
    app.get('/callback/instagram', (req, rep) => handleCallback('instagramOAuth2', req, rep));
    app.get('/callback/google', (req, rep) => handleCallback('googleOAuth2', req, rep));
    app.get('/callback/tiktok', (req, rep) => handleCallback('tiktokOAuth2', req, rep));
};

