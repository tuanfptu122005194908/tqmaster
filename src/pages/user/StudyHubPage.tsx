import React, { useEffect, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { toast } from 'sonner';
// @ts-ignore
import studyHubHtml from '../../assets/google-cloud-study-hub.html?raw';

export default function StudyHubPage() {
  const { isPurchased, setCurrentView, isAdmin } = useApp();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Basic protection to ensure only buyers or admins can see it
    if (!isAdmin && !isPurchased('9d863b0b-22fa-4cb5-b467-15103a8904e5')) {
      toast.error('Bạn chưa mua khóa học này hoặc đơn hàng chưa được duyệt!');
      setCurrentView('home');
    }
  }, [isPurchased, setCurrentView, isAdmin]);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
      <iframe 
        ref={iframeRef}
        srcDoc={studyHubHtml} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Google Cloud Study Hub"
      />
    </div>
  );
}
