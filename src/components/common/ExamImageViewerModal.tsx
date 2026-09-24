import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Layers,
  FileArchive,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ExamImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
  zipDownloadUrl?: string;
  zipFileName?: string;
}

export const ExamImageViewerModal: React.FC<ExamImageViewerModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title,
  zipDownloadUrl,
  zipFileName,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imgLoading, setImgLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);

  // Reset index & zoom when opening or changing initialIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoomLevel(1);
      setImgLoading(true);
      setImgError(false);
    }
  }, [isOpen, initialIndex, images.length]);

  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setZoomLevel(1);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(images.length - 1, prev + 1));
    setZoomLevel(1);
  }, [images.length]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleZoomReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      onClick={onClose}
    >
      {/* ── Top Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'rgba(30, 41, 59, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          flexShrink: 0,
          gap: 16,
          flexWrap: 'wrap',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              flexShrink: 0,
            }}
          >
            <Layers size={18} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#f8fafc',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title || 'Đề thi PE'}
            </h3>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
              Chế độ xem đề thi trực tiếp (Ảnh chụp đề)
            </span>
          </div>
        </div>

        {/* Center: Page Counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '6px 16px',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: 13,
            fontWeight: 700,
            color: '#e2e8f0',
          }}
        >
          <span>Trang {currentIndex + 1}</span>
          <span style={{ color: '#64748b' }}>/</span>
          <span>{images.length} ảnh</span>
        </div>

        {/* Right: Controls & Download ZIP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Zoom controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={handleZoomOut}
              title="Thu nhỏ (-)"
              disabled={zoomLevel <= 0.5}
              style={{
                background: 'transparent',
                border: 'none',
                color: zoomLevel <= 0.5 ? '#64748b' : '#ffffff',
                padding: '8px 10px',
                cursor: zoomLevel <= 0.5 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleZoomReset}
              title="Khôi phục kích thước (0)"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                padding: '8px 8px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                minWidth: 46,
                textAlign: 'center',
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              title="Phóng to (+)"
              disabled={zoomLevel >= 3}
              style={{
                background: 'transparent',
                border: 'none',
                color: zoomLevel >= 3 ? '#64748b' : '#ffffff',
                padding: '8px 10px',
                cursor: zoomLevel >= 3 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Download Original ZIP Button */}
          {zipDownloadUrl && (
            <a
              href={
                zipFileName
                  ? `${zipDownloadUrl}${zipDownloadUrl.includes('?') ? '&' : '?'}download=${encodeURIComponent(zipFileName)}`
                  : zipDownloadUrl
              }
              download={zipFileName || true}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              }}
              title="Tải file ZIP gốc chứa source code / đề bài"
            >
              <FileArchive size={15} />
              <span>Tải file ZIP gốc</span>
            </a>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            title="Đóng (Esc)"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 10,
              color: '#ffffff',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Main Viewport ── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '24px 80px',
        }}
        onClick={onClose}
      >
        {/* Navigation Arrow: Prev */}
        <button
          onClick={e => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={currentIndex === 0}
          title="Ảnh trước (Mũi tên trái)"
          style={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            background: currentIndex === 0 ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: currentIndex === 0 ? '#475569' : '#ffffff',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            zIndex: 10,
            transition: 'all 0.15s ease',
          }}
        >
          <ChevronLeft size={28} />
        </button>

        {/* Center Image */}
        <div
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.15s ease-out',
            cursor: zoomLevel > 1 ? 'grab' : 'zoom-in',
            position: 'relative',
          }}
          onClick={e => {
            e.stopPropagation();
            if (zoomLevel === 1) handleZoomIn();
            else handleZoomReset();
          }}
        >
          {imgLoading && !imgError && (
            <div style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: '#94a3b8',
            }}>
              <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Đang tải ảnh...</span>
            </div>
          )}

          {imgError ? (
            <div style={{
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 16,
              padding: '32px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              color: '#ffffff',
              maxWidth: 420,
              textAlign: 'center',
            }}>
              <AlertCircle size={40} color="#ef4444" />
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 800 }}>Không thể tải ảnh này</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  Đường truyền mạng bị gián đoạn hoặc phiên signed URL đã hết hạn. Bạn có thể tải file ZIP gốc bên dưới để xem offline.
                </p>
              </div>
              {zipDownloadUrl && (
                <a
                  href={zipDownloadUrl}
                  download={zipFileName || true}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    marginTop: 6,
                  }}
                >
                  <Download size={14} /> Tải file ZIP gốc
                </a>
              )}
            </div>
          ) : (
            <img
              src={currentImage}
              alt={`Trang ${currentIndex + 1}`}
              onLoad={() => setImgLoading(false)}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
              }}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 200px)',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                opacity: imgLoading ? 0 : 1,
                transition: 'opacity 0.2s ease',
              }}
            />
          )}
        </div>

        {/* Navigation Arrow: Next */}
        <button
          onClick={e => {
            e.stopPropagation();
            handleNext();
          }}
          disabled={currentIndex === images.length - 1}
          title="Ảnh tiếp theo (Mũi tên phải)"
          style={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            background: currentIndex === images.length - 1 ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: currentIndex === images.length - 1 ? '#475569' : '#ffffff',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentIndex === images.length - 1 ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            zIndex: 10,
            transition: 'all 0.15s ease',
          }}
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* ── Bottom Filmstrip Thumbnail Bar ── */}
      <div
        style={{
          padding: '12px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflowX: 'auto',
          gap: 10,
        }}
        onClick={e => e.stopPropagation()}
      >
        {images.map((img, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setZoomLevel(1);
              }}
              style={{
                position: 'relative',
                width: 60,
                height: 46,
                borderRadius: 6,
                overflow: 'hidden',
                border: isActive ? '2px solid #3b82f6' : '1.5px solid rgba(255, 255, 255, 0.2)',
                background: '#0f172a',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
                opacity: isActive ? 1 : 0.6,
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 0 14px rgba(59, 130, 246, 0.6)' : 'none',
              }}
            >
              <img
                src={img}
                alt={`thumb-${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#ffffff',
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '1px 4px',
                  borderRadius: 3,
                }}
              >
                {idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
