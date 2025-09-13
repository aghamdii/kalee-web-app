'use client';

import { useEffect } from 'react';
import { init, track } from '@amplitude/analytics-browser';

interface DownloadRedirectProps {
  targetUrl: string;
  platform: string;
  isSocialMedia: boolean;
  locale: string;
  userAgent: string;
}

export default function DownloadRedirect({ targetUrl, platform, isSocialMedia, locale, userAgent }: DownloadRedirectProps) {
  useEffect(() => {
    // Initialize Amplitude and track page view
    if (typeof window !== 'undefined') {
      try {
        const apiKey = process.env.AMPLITUDE_API_KEY;
        console.log('Amplitude API Key:', apiKey ? 'Present' : 'Missing');
        
        if (apiKey && apiKey.trim() !== '') {
          // Initialize with simple configuration
          init(apiKey, undefined, {
            logLevel: 0, // Disable logging to prevent console errors
            defaultTracking: false // Disable auto-tracking
          });
          
          console.log('Amplitude initialized, attempting to track...');
          
          // Longer delay to ensure initialization
          setTimeout(() => {
            console.log('Sending track event...');
            track('Download Page Viewed', {
              platform,
              isSocialMedia,
              locale,
              userAgent: userAgent.substring(0, 100), // Shorter user agent
              targetUrl,
              timestamp: Date.now(),
              source: 'intermediate_download_page'
            }).promise.then(() => {
              console.log('Track event sent successfully');
            }).catch((error) => {
              console.error('Track event failed:', error);
            });
          }, 500);
          
          // Auto-redirect after 3 seconds for social media users
          if (isSocialMedia) {
            setTimeout(() => {
              console.log('Triggering redirect...');
              track('Auto Redirect Triggered', {
                platform,
                targetUrl,
                countdown_duration: 1,
                source: 'intermediate_download_page'
              }).promise.then(() => {
                console.log('Redirect track sent, navigating...');
                window.location.href = targetUrl;
              }).catch((error) => {
                console.error('Redirect track failed, navigating anyway:', error);
                window.location.href = targetUrl;
              });
            }, 1000);
          }
        } else {
          console.warn('Amplitude API key not found or empty');
          // Still redirect even if tracking fails
          if (isSocialMedia) {
            setTimeout(() => {
              window.location.href = targetUrl;
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Amplitude error:', error);
        // Fallback: redirect even if tracking fails
        if (isSocialMedia) {
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 1000);
        }
      }
    }
  }, [targetUrl, platform, isSocialMedia, locale, userAgent]);

  if (!isSocialMedia) {
    return null;
  }

  return null;
}