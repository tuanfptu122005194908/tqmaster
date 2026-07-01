import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatPrice, generateOrderId, subjectColor, subjectInitials } from '@/lib/mockData';
import {
  ShoppingCart, Trash2, ArrowRight, ArrowLeft, Upload, CheckSquare, Copy,
  Loader2, X, ShieldCheck, Building2, CreditCard, User, Banknote, Lock,
  Tag, Package, Receipt, CheckCircle2, Sparkles, BadgeCheck,
} from 'lucide-react';

type Step = 'cart' | 'checkout' | 'confirm';
type DiscountCode = Tables<'discount_codes'>;

export default function CartPage() {
  const { cart, removeFromCart, clearCart, profile, refreshPurchased, setCurrentView } = useApp();

  const [step,        setStep]        = useState<Step>('cart');
  const [couponCode,  setCouponCode]  = useState('');
  const [coupon,      setCoupon]      = useState<DiscountCode | null>(null);
  const [couponError, setCouponError] = useState('');
  const [studentCode, setStudentCode] = useState(profile?.student_code || '');
  const [fullName,    setFullName]    = useState(profile?.full_name || '');
  const [transferred, setTransferred] = useState(false);
  const [billFile,    setBillFile]    = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [orderId,     setOrderId]     = useState<string | null>(null);
  const [bankInfo,    setBankInfo]    = useState<Record<string, string>>({});
  const [copied,      setCopied]      = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('system_settings')
      .select('key, value')
      .in('key', ['bank_name', 'bank_account', 'bank_owner', 'bank_content', 'bank_qr_url'])
      .then(({ data }) => {
        const m: Record<string, string> = {};
        (data ?? []).forEach(r => { m[r.key] = r.value ?? ''; });
        setBankInfo(m);
      });
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + Number(i.price), 0);
  const discount = coupon
    ? coupon.discount_type === 'percent'
      ? Math.floor(subtotal * Number(coupon.value) / 100)
      : Math.min(subtotal, Number(coupon.value))
    : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    const { data } = await supabase.from('discount_codes')
      .select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).single();
    if (!data) { setCouponError('Mã không tồn tại hoặc đã hết hạn'); setCoupon(null); return; }
    if (data.max_uses && data.used_count >= data.max_uses) { setCouponError('Mã đã hết lượt sử dụng'); setCoupon(null); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponError('Mã đã hết hạn'); setCoupon(null); return; }
    setCoupon(data);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBillFile(f);
    setBillPreview(URL.createObjectURL(f));
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1400);
  };

  const transferContent = (bankInfo['bank_content'] || 'TQMASTER [MaSV] [HoTen]')
    .replace('[MaSV]', studentCode || '[MaSV]')
    .replace('[HoTen]', fullName || '[HoTen]');

  const handleSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);

    try {
      let billImagePath: string | null = null;
      if (billFile) {
        const ext = billFile.name.split('.').pop();
        const path = `${profile.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('bill-images').upload(path, billFile);
        if (!upErr) billImagePath = path;
      }

      // Server-authoritative order creation. Prices/discount are recomputed from DB.
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          subjectIds: cart.map(s => s.id),
          couponCode: coupon?.code ?? null,
          fullName,
          studentCode,
          billImagePath,
        },
      });

      if (error || !data?.orderId) {
        const msg = (data as any)?.error || error?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.';
        alert(msg);
        return;
      }

      setOrderId(data.orderId);
      clearCart();
      await refreshPurchased();
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Stepper ────────────────────────────────────────
  const Stepper = ({ current }: { current: Step }) => {
    const steps: { key: Step; label: string; n: number }[] = [
      { key: 'cart',     label: 'Giỏ hàng',   n: 1 },
      { key: 'checkout', label: 'Thông tin',  n: 2 },
      { key: 'confirm',  label: 'Thanh toán', n: 3 },
    ];
    const idx = steps.findIndex(s => s.key === current);
    return (
      <div className="checkout-stepper">
        {steps.map((s, i) => {
          const state = i < idx ? 'done' : i === idx ? 'active' : '';
          return (
            <React.Fragment key={s.key}>
              <div className={`step-dot ${state}`}>
                <span className="step-num">{i < idx ? <CheckCircle2 size={14} strokeWidth={3} /> : s.n}</span>
                <span className="step-label">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`step-bar ${i < idx ? 'done' : ''}`} />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ═══ SUCCESS SCREEN ════════════════════════════════════
  if (orderId) {
    return (
      <div className="page-shell" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-12)' }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, hsl(var(--success-light)), hsl(162 48% 90%))',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'var(--space-5)',
          boxShadow: '0 8px 32px hsl(var(--success) / 0.2)',
          position: 'relative',
        }}>
          <CheckCircle2 size={48} strokeWidth={2.5} style={{ color: 'hsl(var(--success))' }} />
          <Sparkles size={20} style={{ position: 'absolute', top: 8, right: 6, color: 'hsl(var(--success))' }} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Đặt hàng thành công!</h1>
        <p style={{ color: 'hsl(var(--muted-fg))', lineHeight: 1.6, marginBottom: 'var(--space-6)', fontSize: '0.9375rem' }}>
          Đơn hàng <strong style={{ color: 'hsl(var(--foreground))' }}>{orderId}</strong> của bạn đang chờ admin xác nhận.<br/>
          Sau khi được duyệt, tài liệu sẽ được mở khóa ngay lập tức.
        </p>
        <div style={{
          background: 'hsl(var(--primary-subtle))',
          border: '1px solid hsl(var(--primary) / 0.15)',
          borderRadius: 'calc(var(--radius) * 2)',
          padding: 'var(--space-4) var(--space-5)',
          fontSize: '0.875rem', color: 'hsl(var(--primary-dark))',
          marginBottom: 'var(--space-6)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'center',
        }}>
          <BadgeCheck size={18} />
          <span>Theo dõi trạng thái tại <strong>Hồ sơ → Đơn hàng</strong></span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-ghost touch-target" style={{ border: '1px solid hsl(var(--border))' }} onClick={() => setCurrentView('home')}>
            Tiếp tục mua sắm
          </button>
          <button className="btn-primary touch-target" onClick={() => setCurrentView('profile')}>
            Xem đơn hàng <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ═══ EMPTY CART ═══════════════════════════════════════
  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="page-shell" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          textAlign: 'center', padding: 'var(--space-16) var(--space-4)',
          background: 'hsl(var(--primary-subtle))',
          border: '1px solid hsl(var(--primary) / 0.08)',
          borderRadius: 'calc(var(--radius) * 3)',
        }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--space-5)', boxShadow: 'var(--shadow-sm)',
          }}>
            <ShoppingCart size={40} style={{ color: 'hsl(var(--primary))', opacity: 0.6 }} />
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Giỏ hàng đang trống</h2>
          <p style={{ color: 'hsl(var(--muted-fg))', fontSize: '0.9375rem', marginBottom: 'var(--space-6)', maxWidth: 360, margin: '0 auto var(--space-6)' }}>
            Khám phá các môn học và thêm vào giỏ để bắt đầu hành trình học tập.
          </p>
          <button className="btn-primary touch-target" onClick={() => setCurrentView('home')}>
            <ArrowLeft size={16} /> Khám phá khóa học
          </button>
        </div>
      </div>
    );
  }

  // ═══ ORDER SUMMARY (reused) ═══════════════════════════
  const SummaryCard = ({ showCoupon = false }: { showCoupon?: boolean }) => (
    <div style={{
      background: 'hsl(var(--surface-raised))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'calc(var(--radius) * 2)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }} className="checkout-summary">
      <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Receipt size={18} style={{ color: 'hsl(var(--primary))' }} />
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Tóm tắt đơn hàng</h3>
      </div>

      <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: 280, overflowY: 'auto' }}>
        {cart.map(item => {
          const c = subjectColor(item.name);
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.875rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: c + '20', color: c,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.75rem',
              }}>{subjectInitials(item.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>Kỳ {item.semester}</div>
              </div>
              <strong style={{ color: 'hsl(var(--foreground))', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(Number(item.price))}</strong>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--muted-fg))' }}>
          <span>Tạm tính ({cart.length} môn)</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(subtotal)}</span>
        </div>
        {coupon && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--success))' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={12} /> {coupon.code}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>−{formatPrice(discount)}</span>
          </div>
        )}
      </div>

      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        background: 'linear-gradient(135deg, hsl(var(--primary-subtle)) 0%, hsl(var(--primary-muted)) 100%)',
        borderTop: '1px solid hsl(var(--primary) / 0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'hsl(var(--muted-fg))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng cộng</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'hsl(var(--primary))', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{formatPrice(total)}</span>
      </div>
    </div>
  );

  // ═══ CONFIRM (PAYMENT) STEP ═══════════════════════════
  if (step === 'confirm') {
    return (
      <div className="page-shell" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Stepper current="confirm" />

        <div className="checkout-grid">
          {/* LEFT: payment instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Bank info card */}
            <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 2)', overflow: 'hidden', background: 'hsl(var(--surface-raised))', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)', color: 'white' }}>
                <CreditCard size={20} />
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'white', margin: 0 }}>Thông tin chuyển khoản</h3>
              </div>

              <div style={{ padding: 'var(--space-2) var(--space-5)' }}>
                {[
                  { label: 'Ngân hàng',     value: bankInfo['bank_name']    || '—', icon: Building2,   key: 'bank' },
                  { label: 'Số tài khoản',  value: bankInfo['bank_account'] || '—', icon: CreditCard,  key: 'acct', mono: true },
                  { label: 'Chủ tài khoản', value: bankInfo['bank_owner']   || '—', icon: User,        key: 'owner' },
                  { label: 'Nội dung CK',   value: transferContent,                  icon: ShieldCheck, key: 'note', mono: true },
                ].map(row => (
                  <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid hsl(var(--border))', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'hsl(var(--muted-fg))', minWidth: 0, flexShrink: 0 }}>
                      <row.icon size={16} />
                      <span style={{ fontSize: '0.8125rem' }}>{row.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
                      <strong style={{
                        fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--foreground))',
                        fontFamily: row.mono ? 'JetBrains Mono, ui-monospace, monospace' : undefined,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textAlign: 'right',
                      }}>{row.value}</strong>
                      <button
                        type="button"
                        onClick={() => copyText(row.value, row.key)}
                        title="Sao chép"
                        style={{
                          width: 32, height: 32, padding: 0, borderRadius: 8, flexShrink: 0,
                          background: copied === row.key ? 'hsl(var(--success-light))' : 'hsl(var(--primary-muted))',
                          color: copied === row.key ? 'hsl(var(--success))' : 'hsl(var(--primary))',
                          border: 'none', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.18s',
                        }}
                      >
                        {copied === row.key ? <CheckCircle2 size={15} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Amount row (highlighted) */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-4)', margin: 'var(--space-3) 0',
                  background: 'linear-gradient(135deg, hsl(var(--primary-muted)) 0%, hsl(var(--primary-subtle)) 100%)',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  border: '1px solid hsl(var(--primary) / 0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'hsl(var(--primary))' }}>
                    <Banknote size={18} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Số tiền cần CK</span>
                  </div>
                  <strong style={{ fontSize: '1.375rem', fontWeight: 900, color: 'hsl(var(--primary))', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{formatPrice(total)}</strong>
                </div>
              </div>
            </div>

            {/* QR code */}
            {bankInfo['bank_qr_url'] && (
              <div style={{
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) * 2)',
                overflow: 'hidden',
                background: 'hsl(var(--surface-raised))',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Sparkles size={18} style={{ color: 'hsl(var(--primary))' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Quét mã QR thanh toán</h3>
                </div>
                <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ background: 'white', padding: 'var(--space-3)', borderRadius: 12, border: '2px solid hsl(var(--primary) / 0.15)', boxShadow: '0 8px 24px hsl(var(--primary) / 0.1)' }}>
                    <img src={bankInfo['bank_qr_url']} alt="QR" style={{ width: 200, height: 200, objectFit: 'contain', display: 'block' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
                      Mở app ngân hàng → chọn <strong>Quét QR</strong> → xác nhận chuyển khoản.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'hsl(var(--warning-light))', borderRadius: 8, fontSize: '0.8125rem', color: 'hsl(36 60% 28%)' }}>
                      <Lock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>Vui lòng nhập đúng <strong>nội dung CK</strong> để được duyệt nhanh chóng.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bill upload */}
            <div style={{
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) * 2)',
              background: 'hsl(var(--surface-raised))',
              padding: 'var(--space-5)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 700, fontSize: '0.9375rem', marginBottom: 'var(--space-3)' }}>
                <Upload size={16} style={{ color: 'hsl(var(--primary))' }} />
                Ảnh bill chuyển khoản <span style={{ color: 'hsl(var(--danger))' }}>*</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${billPreview ? 'hsl(var(--primary))' : 'hsl(var(--border-strong))'}`,
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  padding: billPreview ? 0 : 'var(--space-8) var(--space-4)',
                  textAlign: 'center',
                  background: billPreview ? 'transparent' : 'hsl(var(--primary-subtle))',
                  cursor: 'pointer', overflow: 'hidden', minHeight: 140,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {billPreview ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <img src={billPreview} alt="bill preview" style={{ maxHeight: 320, width: '100%', objectFit: 'contain', display: 'block' }} />
                    <button
                      onClick={e => { e.stopPropagation(); setBillFile(null); setBillPreview(null); }}
                      style={{ position: 'absolute', top: 12, right: 12, background: 'hsl(var(--danger))', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'white', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)', boxShadow: 'var(--shadow-sm)' }}>
                      <Upload size={24} />
                    </div>
                    <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--foreground))', fontWeight: 600 }}>Nhấn để tải ảnh bill</p>
                    <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', marginTop: 4 }}>PNG, JPG tối đa 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: summary + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <SummaryCard />

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', cursor: 'pointer',
              fontSize: '0.875rem', color: 'hsl(var(--foreground))',
              padding: 'var(--space-4)',
              background: 'hsl(var(--surface-raised))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) * 1.5)',
            }}>
              <input type="checkbox" checked={transferred} onChange={e => setTransferred(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'hsl(var(--primary))', cursor: 'pointer', marginTop: 2 }} />
              <span style={{ lineHeight: 1.5 }}>Tôi đã chuyển khoản <strong>đúng số tiền</strong> và <strong>đúng nội dung</strong> nêu trên</span>
            </label>

            <button id="submit-order-btn" className="btn-primary touch-target"
              style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-4)', fontSize: '0.9375rem', borderRadius: 'calc(var(--radius) * 1.5)' }}
              disabled={!transferred || !billFile || submitting}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={18} />}
              {submitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>

            <button className="btn-ghost touch-target"
              style={{ width: '100%', justifyContent: 'center', border: '1px solid hsl(var(--border))', background: 'white', color: 'hsl(var(--foreground))' }}
              onClick={() => setStep('checkout')}
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'hsl(var(--muted-fg))', fontSize: '0.75rem', marginTop: 'var(--space-2)' }}>
              <Lock size={12} />
              <span>Thông tin thanh toán được mã hóa & bảo mật</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ CHECKOUT (INFO) STEP ═════════════════════════════
  if (step === 'checkout') {
    return (
      <div className="page-shell" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Stepper current="checkout" />

        <div className="checkout-grid">
          {/* LEFT: form */}
          <div style={{
            background: 'hsl(var(--surface-raised))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'calc(var(--radius) * 2)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <User size={18} style={{ color: 'hsl(var(--primary))' }} />
              Thông tin của bạn
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', marginBottom: 'var(--space-5)' }}>
              Nhập thông tin để chúng tôi liên hệ và cấp quyền truy cập tài liệu
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label className="field-label">Họ và tên <span style={{ color: 'hsl(var(--danger))' }}>*</span></label>
                <input className="field-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="field-label">Mã sinh viên <span style={{ color: 'hsl(var(--danger))' }}>*</span></label>
                <input className="field-input" style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }} value={studentCode} onChange={e => setStudentCode(e.target.value)} placeholder="HE181234" />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input className="field-input" disabled value={profile?.email || ''} />
              </div>

              {/* Coupon */}
              <div>
                <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={14} /> Mã giảm giá <span style={{ fontWeight: 400, color: 'hsl(var(--muted-fg))' }}>(tuỳ chọn)</span>
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="NHẬP MÃ"
                    disabled={!!coupon}
                    className="field-input"
                    style={{
                      flex: 1,
                      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                      letterSpacing: '0.05em',
                      borderColor: coupon ? 'hsl(var(--success))' : couponError ? 'hsl(var(--danger))' : undefined,
                      background: coupon ? 'hsl(var(--success-light))' : undefined,
                    }}
                  />
                  {coupon ? (
                    <button className="btn-ghost touch-target" style={{ color: 'hsl(var(--danger))', border: '1px solid hsl(var(--border))' }} onClick={() => { setCoupon(null); setCouponCode(''); setCouponError(''); }}>Bỏ</button>
                  ) : (
                    <button className="btn-primary touch-target" onClick={applyCoupon} disabled={!couponCode}>Áp dụng</button>
                  )}
                </div>
                {couponError && <p style={{ fontSize: '0.75rem', color: 'hsl(var(--danger))', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}><X size={12} /> {couponError}</p>}
                {coupon && (
                  <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--success))', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> Áp dụng thành công! Giảm {coupon.discount_type === 'percent' ? `${coupon.value}%` : formatPrice(Number(coupon.value))}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <SummaryCard />

            <button
              id="proceed-to-confirm"
              className="btn-primary touch-target"
              style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-4)', fontSize: '0.9375rem', borderRadius: 'calc(var(--radius) * 1.5)' }}
              disabled={!fullName || !studentCode}
              onClick={() => setStep('confirm')}
            >
              Tiếp tục thanh toán <ArrowRight size={16} />
            </button>
            <button className="btn-ghost touch-target"
              style={{ width: '100%', justifyContent: 'center', border: '1px solid hsl(var(--border))', background: 'white', color: 'hsl(var(--foreground))' }}
              onClick={() => setStep('cart')}
            >
              <ArrowLeft size={16} /> Quay lại giỏ hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ CART STEP ════════════════════════════════════════
  return (
    <div className="page-shell" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Stepper current="cart" />

      <div className="checkout-grid">
        {/* LEFT: cart items */}
        <div style={{
          background: 'hsl(var(--surface-raised))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'calc(var(--radius) * 2)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} style={{ color: 'hsl(var(--primary))' }} />
              Giỏ hàng của bạn
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'hsl(var(--primary-muted))', color: 'hsl(var(--primary))' }}>{cart.length}</span>
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'hsl(var(--muted-fg))', fontSize: '0.8125rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Trash2 size={13} /> Xoá tất cả
              </button>
            )}
          </div>

          <div>
            {cart.map((item, i) => {
              const c = subjectColor(item.name);
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-4) var(--space-5)',
                  borderBottom: i < cart.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${c}20, ${c}10)`,
                    color: c,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.9375rem',
                    border: `1px solid ${c}30`,
                  }}>{subjectInitials(item.name)}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '1px 8px', borderRadius: 4, background: 'hsl(var(--muted))', fontWeight: 600 }}>Kỳ {item.semester}</span>
                      <span style={{ color: 'hsl(var(--success))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CheckCircle2 size={11} /> Vĩnh viễn
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <strong style={{ fontWeight: 800, color: 'hsl(var(--primary))', fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(Number(item.price))}</strong>
                    <button
                      className="touch-target"
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        width: 36, height: 36, padding: 0, borderRadius: 8,
                        background: 'transparent', color: 'hsl(var(--muted-fg))',
                        border: '1px solid transparent', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--danger-light))'; e.currentTarget.style.color = 'hsl(var(--danger))'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-fg))'; }}
                      title="Xoá"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: summary + CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <SummaryCard />

          <button
            id="proceed-to-checkout"
            className="btn-primary touch-target"
            style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-4)', fontSize: '0.9375rem', borderRadius: 'calc(var(--radius) * 1.5)' }}
            onClick={() => setStep('checkout')}
          >
            Tiến hành thanh toán <ArrowRight size={16} />
          </button>
          <button
            className="btn-ghost touch-target"
            style={{ width: '100%', justifyContent: 'center', border: '1px solid hsl(var(--border))', background: 'white', color: 'hsl(var(--foreground))' }}
            onClick={() => setCurrentView('home')}
          >
            <ArrowLeft size={16} /> Tiếp tục mua sắm
          </button>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'hsl(var(--success-light))',
            borderRadius: 'calc(var(--radius) * 1.5)',
            fontSize: '0.75rem', color: 'hsl(var(--success))',
          }}>
            <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Mua một lần, sở hữu vĩnh viễn.</strong> Truy cập tài liệu mọi lúc, mọi nơi.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
