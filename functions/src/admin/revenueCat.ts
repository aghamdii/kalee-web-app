import * as logger from 'firebase-functions/logger';

const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';

interface GrantEntitlementResult {
  success: boolean;
  grantId?: string;
  error?: string;
}

export async function grantPromotionalEntitlement(
  secretKey: string,
  appUserId: string,
  entitlementId: string,
  duration: 'yearly' | 'lifetime' | 'monthly' = 'yearly'
): Promise<GrantEntitlementResult> {
  const url = `${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementId)}/promotional`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('RevenueCat API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return {
        success: false,
        error: `RevenueCat API error: ${response.status} - ${errorData.message || response.statusText}`,
      };
    }

    const data = await response.json();
    logger.info('RevenueCat entitlement granted successfully', {
      appUserId,
      entitlementId,
      duration,
    });

    return {
      success: true,
      grantId: data.subscriber?.original_app_user_id || appUserId,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('RevenueCat API request failed:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
