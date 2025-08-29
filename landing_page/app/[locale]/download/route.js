// app/[locale]/download/route.js (for App Router)
import { NextResponse } from 'next/server';
import { init, track, flush } from '@amplitude/analytics-node';

// Initialize Amplitude for server-side tracking
init(process.env.AMPLITUDE_API_KEY);

export async function GET(request) {
    const userAgent = request.headers.get('user-agent') || '';

    // Your existing app store URLs
    const appStoreUrl = "https://apps.apple.com/app/id6751262332";
    const googlePlayUrl = "https://play.google.com/store/apps/details?id=com.aghamdii.kalee";

    // Same device detection logic as your button
    const isAndroidDevice = userAgent.toLowerCase().includes('android');
    const platform = isAndroidDevice ? 'Android' : 'iOS';

    // Track platform detection server-side
    try {
        await track(
            `Link Store Navigated - ${platform}`,
            {
                timestamp: Date.now(),
                userAgent,
                referrer: request.headers.get('referer') || 'direct',
                source: 'direct_link'
            },
            {
                user_id: `anonymous_${Date.now()}` // Generate anonymous user ID
            }
        );
        
        // Flush to ensure event is sent before redirect
        await flush();
    } catch (error) {
        console.error('Amplitude tracking error:', error);
    }

    // Redirect to appropriate store
    const targetUrl = isAndroidDevice ? googlePlayUrl : appStoreUrl;

    return NextResponse.redirect(targetUrl, { status: 302 });
}