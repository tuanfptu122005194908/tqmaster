import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'hsl(210, 40%, 98%)', // match --background
          padding: '24px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
            border: '1px solid hsl(214.3, 31.8%, 91.4%)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'hsl(346, 84%, 96%)', // danger-light
              color: 'hsl(346, 84%, 61%)',       // danger
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={40} />
            </div>
            
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 800, 
              color: 'hsl(222.2, 84%, 4.9%)',
              margin: '0 0 12px 0'
            }}>
              Đã xảy ra sự cố!
            </h1>
            
            <p style={{ 
              color: 'hsl(215.4, 16.3%, 46.9%)',
              lineHeight: 1.6,
              marginBottom: '32px',
              fontSize: '0.9375rem'
            }}>
              Rất xin lỗi, hệ thống vừa gặp một lỗi không mong muốn trong quá trình xử lý. 
              Bạn có thể tải lại trang hoặc quay về trang chủ để tiếp tục.
            </p>

            {/* Error detail for developers (optional, usually hidden in production, but helpful in dev) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: 'hsl(210, 40%, 96.1%)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '32px',
                textAlign: 'left',
                overflowX: 'auto',
                fontSize: '0.75rem',
                color: 'hsl(346, 84%, 61%)',
                fontFamily: 'monospace'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'hsl(238, 84%, 60%)', // primary
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <RefreshCw size={18} />
                Tải lại trang
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'white',
                  color: 'hsl(222.2, 84%, 4.9%)',
                  border: '1px solid hsl(214.3, 31.8%, 91.4%)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'hsl(210, 40%, 98%)'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <Home size={18} />
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
