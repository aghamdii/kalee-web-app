import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

export class FoodUtils {
    
    // Firebase Storage utilities
    static async getImageFromStorage(imagePath: string): Promise<Buffer> {
        try {
            const bucket = admin.storage().bucket();
            const file = bucket.file(imagePath);
            
            const [exists] = await file.exists();
            if (!exists) {
                throw new Error(`Image not found at path: ${imagePath}`);
            }
            
            const [fileContents] = await file.download();
            return fileContents;
        } catch (error) {
            logger.error('Error downloading image from storage:', error);
            throw new Error(`Failed to download image: ${error}`);
        }
    }

    // Convert image buffer to base64 for AI processing
    static imageToBase64(imageBuffer: Buffer): string {
        return imageBuffer.toString('base64');
    }

    // Validate image file type
    static validateImage(imagePath: string): { isValid: boolean; error?: string } {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        
        const extension = imagePath.toLowerCase().substring(imagePath.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(extension)) {
            return {
                isValid: false,
                error: 'Unsupported image format. Please use JPG, PNG, or WebP.'
            };
        }
        
        return { isValid: true };
    }

    // Session management in Firestore
    static async saveAnalysisSession(sessionId: string, data: any): Promise<void> {
        try {
            const db = admin.firestore();
            await db.collection('aiSessions').doc(sessionId).set({
                ...data,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            logger.error('Error saving analysis session:', error);
            throw new Error('Failed to save analysis session');
        }
    }

    static async getAnalysisSession(sessionId: string): Promise<any | null> {
        try {
            const db = admin.firestore();
            const doc = await db.collection('aiSessions').doc(sessionId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            logger.error('Error retrieving analysis session:', error);
            return null;
        }
    }

    static async updateAnalysisSession(sessionId: string, data: any): Promise<void> {
        try {
            const db = admin.firestore();
            await db.collection('aiSessions').doc(sessionId).update({
                ...data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            logger.error('Error updating analysis session:', error);
            throw new Error('Failed to update analysis session');
        }
    }

    // Input validation utilities

    // New validation function for unified functions (no userId required - uses Firebase Auth instead)
    static validateUnifiedAnalysisRequest(data: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (!data.storagePath || typeof data.storagePath !== 'string') {
            errors.push('storagePath is required and must be a string');
        }
        
        if (data.language && typeof data.language !== 'string') {
            errors.push('language must be a string');
        }
        
        if (data.unitSystem && !['metric', 'imperial'].includes(data.unitSystem)) {
            errors.push('unitSystem must be either "metric" or "imperial"');
        }
        
        if (data.notes && typeof data.notes !== 'string') {
            errors.push('notes must be a string');
        }
        
        if (data.notes && data.notes.length > 200) {
            errors.push('notes must be 200 characters or less');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }


    // Error response helpers
    static createErrorResponse(code: string, message: string, sessionId?: string, language: string = 'en') {
        return {
            error: {
                code,
                message,
                timestamp: new Date().toISOString()
            },
            sessionId: sessionId || null,
            language
        };
    }

    // Logging utilities
    static logFunctionStart(functionName: string, userId: string, data: any) {
        logger.info(`${functionName} started`, {
            userId,
            timestamp: new Date().toISOString(),
            requestData: {
                ...data,
                // Don't log sensitive data
                imagePath: data.imagePath ? 'provided' : 'not provided'
            }
        });
    }

    static logFunctionEnd(functionName: string, userId: string, success: boolean, duration: number) {
        logger.info(`${functionName} completed`, {
            userId,
            success,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    }

    static logError(functionName: string, error: any, userId?: string, sessionId?: string) {
        logger.error(`${functionName} error`, {
            userId: userId || 'unknown',
            sessionId: sessionId || 'unknown',
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code
            },
            timestamp: new Date().toISOString()
        });
    }

    // Performance monitoring
    static createTimer() {
        const start = Date.now();
        return {
            end: () => Date.now() - start
        };
    }

    // Helper to clean up old sessions (can be called periodically)
    static async cleanupOldSessions(olderThanDays: number = 7): Promise<void> {
        try {
            const db = admin.firestore();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            
            const oldSessions = await db.collection('aiSessions')
                .where('createdAt', '<', cutoffDate)
                .limit(500) // Process in batches
                .get();
            
            const batch = db.batch();
            oldSessions.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            if (oldSessions.docs.length > 0) {
                await batch.commit();
                logger.info(`Cleaned up ${oldSessions.docs.length} old analysis sessions`);
            }
        } catch (error) {
            logger.error('Error cleaning up old sessions:', error);
        }
    }
}