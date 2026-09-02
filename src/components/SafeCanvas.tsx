import React from 'react';
import { Canvas as FiberCanvas, type CanvasProps } from '@react-three/fiber';

/** Kiểm tra trình duyệt/thiết bị có hỗ trợ WebGL hay không (chỉ chạy 1 lần) */
let webglSupported: boolean | null = null;
function isWebGLAvailable(): boolean {
  if (webglSupported !== null) return webglSupported;
  try {
    const canvas = document.createElement('canvas');
    webglSupported = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    webglSupported = false;
  }
  return webglSupported;
}

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[SafeCanvas] Không thể khởi tạo WebGL, đã bỏ qua hiệu ứng 3D:', error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/**
 * Canvas an toàn: nếu thiết bị không hỗ trợ WebGL (hoặc quá nhiều context)
 * thì hiển thị fallback thay vì làm trắng cả trang.
 */
export function Canvas({ fallback = null, ...props }: CanvasProps & { fallback?: React.ReactNode }) {
  const [supported] = React.useState(() => typeof window !== 'undefined' && isWebGLAvailable());
  if (!supported) return <>{fallback}</>;
  return (
    <WebGLErrorBoundary fallback={fallback}>
      <FiberCanvas {...props} />
    </WebGLErrorBoundary>
  );
}

export default Canvas;
