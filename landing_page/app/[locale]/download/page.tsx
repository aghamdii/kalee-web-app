import { headers } from 'next/headers';
import DownloadRedirect from '@/components/DownloadRedirect';
import { SiTiktok } from 'react-icons/si';

interface DownloadPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    platform?: string;
  }>;
}

export default async function DownloadPage({ params, searchParams }: DownloadPageProps) {
  await params; // Keep for route structure
  const { platform: platformParam } = await searchParams;
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  
  // Detect platform 
  const isAndroidDevice = userAgent.toLowerCase().includes('android');
  const platform = platformParam || (isAndroidDevice ? 'android' : 'ios');
  
  const appStoreUrl = "https://apps.apple.com/app/id6751262332";
  const googlePlayUrl = "https://play.google.com/store/apps/details?id=com.aghamdii.kalee";
  const targetUrl = platform === 'android' ? googlePlayUrl : appStoreUrl;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4" dir="rtl">
      {/* TikTok Instructions - Top Right Corner */}
      <div className="absolute top-6 right-6 bg-white rounded-xl shadow-lg p-4 max-w-sm border border-gray-100">
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-3">
            <span className="text-sm text-gray-700">للمستخدمين من</span>
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <SiTiktok className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2 mb-3">
            <span className="text-sm text-gray-700">اضغط على</span>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">⋯</span>
            </div>
          </div>
          
          <div className="text-xs text-blue-600 mb-2">
            ثم اختر "فتح في المتصفح"
          </div>
          
          <div className="text-xs text-blue-700 font-medium text-center">
            "Open in browser"
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center">
        {/* App Logo */}
        <div className="mb-8">
          <img 
            src="/kalee_logo_circle.png" 
            alt="كاليه" 
            className="w-24 h-24 mx-auto mb-6"
          />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          تطبيق كالي
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          سوف يتم توجيهك الى المتجر لتتمكن من تحميل التطبيق
        </p>

        {/* Simple Countdown */}
        <DownloadRedirect 
          targetUrl={targetUrl}
          platform={platform}
          isSocialMedia={true}
          locale="ar"
          userAgent={userAgent}
        />
      </div>
    </div>
  );
}