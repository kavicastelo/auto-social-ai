import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/index.js';

const s3 = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT, // e.g. https://<account_id>.r2.cloudflarestorage.com
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = env.S3_BUCKET_NAME;

/**
 * Generates a presigned URL that the client will use to upload a file directly to S3/R2.
 */
export async function generateUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Uploads a buffer directly to the storage. Suitable for background tasks like AI generation.
 */
export async function uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await s3.send(command);
    return getPublicUrl(key);
}

/**
 * Returns the public URL for an asset. If bucket is public, it's just a concatenated string.
 * If private, we can generate a short-lived read URL.
 */
export function getPublicUrl(key: string): string {
    if (env.S3_PUBLIC_DOMAIN) {
        return `${env.S3_PUBLIC_DOMAIN}/${key}`;
    }
    // Fallback if no public domain is registered, could use getSignedUrl for GetObjectCommand based on your security needs
    return `https://${BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}
