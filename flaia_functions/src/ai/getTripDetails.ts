import { CallableRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { handleAiError } from '../shared/errorHandler';

export async function getTripDetails(request: CallableRequest): Promise<any> {
    try {
        // Extract trip ID from request data
        const { tripId } = request.data;

        if (!tripId) {
            throw new Error('Trip ID is required');
        }

        console.log(`[${request.auth?.uid || 'ANONYMOUS'}] [get_trip] [${tripId}] Fetching trip details`);

        const db = admin.firestore();

        // Fetch trip document from 'itineraries' collection
        const docRef = db.collection('itineraries').doc(tripId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log(`[${request.auth?.uid || 'ANONYMOUS'}] [get_trip] [${tripId}] Trip not found`);
            return {
                success: false,
                error: 'TRIP_NOT_FOUND',
                message: 'Trip not found. Please check the trip ID.',
            };
        }

        const tripData = docSnap.data();

        // Process days array to handle Firestore Timestamps and ensure required fields
        const processedDays = (tripData?.days || []).map((day: any, index: number) => {
            const processedActivities = (day.activities || []).map((activity: any) => {
                // Process timing data
                const processedTiming = {
                    startTime: activity.timing?.startTime || activity.timing?.start_time || '',
                    endTime: activity.timing?.endTime || activity.timing?.end_time || '',
                    displayTime: activity.timing?.displayTime || activity.timing?.display_time || undefined
                };

                // Process price data
                const processedPrice = {
                    amount: activity.price?.amount || 0,
                    currency: activity.price?.currency || 'USD',
                    isFree: activity.price?.isFree !== undefined ? activity.price.isFree : (activity.price?.amount === 0 || !activity.price?.amount)
                };

                return {
                    ...activity,
                    timing: processedTiming,
                    price: processedPrice,
                    // Ensure other required fields
                    requiresBooking: activity.booking?.requires_booking || false,
                    bookingUrl: activity.booking?.booking_url || '',
                    mapUrl: activity.location?.map_url || '',
                    detailsUrl: activity.booking?.details_url || ''
                };
            });

            return {
                ...day,
                // Ensure dayNumber exists (fallback to index + 1)
                dayNumber: day.dayNumber || day.day_number || (index + 1),
                // Convert Firestore Timestamp to ISO string if needed
                date: day.date?.toDate?.()?.toISOString() || day.date || '',
                // Use processed activities
                activities: processedActivities
            };
        });

        // Convert Firestore data to our expected format
        const processedTrip = {
            id: docSnap.id,
            title: tripData?.title || '',
            destination: tripData?.destination || '',
            summary: tripData?.summary || '',
            startDate: tripData?.start_date?.toDate?.()?.toISOString() || tripData?.start_date || '',
            endDate: tripData?.end_date?.toDate?.()?.toISOString() || tripData?.end_date || '',
            weather: {
                condition: tripData?.weather?.condition || '',
                emoji: tripData?.weather?.emoji || '',
                temperatureRange: tripData?.weather?.temperature_range || tripData?.weather?.temperatureRange || '',
            },
            days: processedDays,
            countryEmoji: tripData?.country_emoji || '',
            backgroundColor: tripData?.background_color || '#8B5CF6',
            createdAt: tripData?.created_at?.toDate?.()?.toISOString() || tripData?.created_at || '',
            shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://flaia.app'}/trips/${tripId}`,
        };

        console.log(`[${request.auth?.uid || 'ANONYMOUS'}] [get_trip] [${tripId}] Trip fetched successfully: ${processedTrip.destination}`);

        return {
            success: true,
            data: processedTrip,
            metadata: {
                fetched_at: new Date().toISOString(),
                trip_id: tripId,
                user_id: request.auth?.uid || null,
            }
        };

    } catch (error) {
        console.error('Get Trip Details Error:', error);
        return handleAiError(error, 'getTripDetails');
    }
}