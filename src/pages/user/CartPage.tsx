import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { parseFunctionError } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import { formatPrice, generateOrderId, subjectColor, subjectInitials } from '@/lib/mockData';
import {
  ShoppingCart, Trash2, ArrowRight, ArrowLeft, Upload, CheckSquare, Copy,
  Loader2, X, ShieldCheck, Building2, CreditCard, User, Banknote, Lock,
  Tag, Package, Receipt, CheckCircle2, Sparkles, BadgeCheck, Zap
} from 'lucide-react';

type Step = 'cart' | 'checkout' | 'confirm';
type DiscountCode = Tables<'discount_codes'>;

import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, profile, refreshPurchased } = useApp();
  const navigate = useNavigate();

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
  const [displayCart, setDisplayCart] = useState<Tables<'subjects'>[]>([]);
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

  // Auto-resolve any string IDs or missing subject details in cart
  useEffect(() => {
    const rawCart = Array.isArray(cart) ? cart : [];
    if (rawCart.length === 0) {
      setDisplayCart([]);
      return;
    }

    const missingIds = rawCart
      .map(i => (typeof i === 'string' ? i : (!i || !i.name || i.price === undefined) ? (i as any)?.id : null))
      .filter((id): id is string => Boolean(id));

    const validObjects = rawCart.filter((i): i is Tables<'subjects'> => typeof i === 'object' && i !== null && Boolean(i.id) && Boolean(i.name));

    if (missingIds.length > 0) {
      supabase.from('subjects').select('*').in('id', missingIds).then(({ data }) => {
        if (data && data.length > 0) {
          const map = new Map<string, Tables<'subjects'>>();
          validObjects.forEach(s => map.set(s.id, s));
          data.forEach(s => map.set(s.id, s));
          const list = rawCart.map(i => {
            const id = typeof i === 'string' ? i : i?.id;
            return map.get(id) || (typeof i === 'object' && i ? i : { id, name: 'Môn học', price: 0, semester: 1 } as any);
          });
          setDisplayCart(list);
        } else {
          setDisplayCart(validObjects);
        }
      });
    } else {
      setDisplayCart(validObjects);
    }
  }, [cart]);

  const subtotal = displayCart.reduce((sum, i) => sum + (Number(i?.price) || 0), 0);
  const discount = coupon
    ? (coupon.min_order_value && subtotal < Number(coupon.min_order_value))
      ? 0
      : coupon.discount_type === 'percent'
        ? Math.floor(subtotal * Number(coupon.value) / 100)
        : Math.min(subtotal, Number(coupon.value))
    : 0;
  const total = subtotal - discount;

  // If subtotal falls below min_order_value, auto-remove coupon with notice
  useEffect(() => {
    if (coupon && coupon.min_order_value && subtotal < Number(coupon.min_order_value)) {
      setCouponError(`Đơn hàng (${formatPrice(subtotal)}) không đủ điều kiện tối thiểu ${formatPrice(Number(coupon.min_order_value))} của mã ${coupon.code}`);
      setCoupon(null);
    }
  }, [subtotal, coupon]);

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    const { data } = await supabase.from('discount_codes')
      .select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).single();
    if (!data) { setCouponError('Mã không tồn tại hoặc đã bị khóa'); setCoupon(null); return; }
    if (data.max_uses && data.used_count >= data.max_uses) { setCouponError('Mã đã hết lượt sử dụng'); setCoupon(null); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { 
      setCouponError(`Mã đã hết hạn sử dụng (${new Date(data.expires_at).toLocaleDateString('vi-VN')})`); 
      setCoupon(null); 
      return; 
    }
    if (data.min_order_value && subtotal < Number(data.min_order_value)) {
      setCouponError(`Đơn hàng phải từ ${formatPrice(Number(data.min_order_value))} trở lên để sử dụng mã này (hiện tại: ${formatPrice(subtotal)})`);
      setCoupon(null);
      return;
    }
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
        if (upErr) {
          alert('Lỗi tải ảnh bill lên hệ thống. Vui lòng thử lại sau.');
          setSubmitting(false);
          return;
        }
        billImagePath = path;
      } else {
        alert('Vui lòng tải lên ảnh bill chuyển khoản.');
        setSubmitting(false);
        return;
      }

      // Server-authoritative order creation. Prices/discount are recomputed from DB.
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          subjectIds: displayCart.map(s => s.id),
          couponCode: coupon?.code ?? null,
          fullName,
          studentCode,
          billImagePath,
        },
      });

      const parsedError = await parseFunctionError(data, error);
      if (parsedError || !data?.orderId) {
        const msg = parsedError || 'Không thể tạo đơn hàng. Vui lòng thử lại.';
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
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2 sm:gap-4 w-full max-w-2xl mx-auto">
          {steps.map((s, i) => {
            const isPast = i < idx;
            const isCurrent = i === idx;
            return (
              <React.Fragment key={s.key}>
                <div className={`flex items-center gap-2 ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    isPast || isCurrent ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isPast ? <CheckCircle2 size={16} strokeWidth={3} /> : s.n}
                  </div>
                  <span className={`hidden sm:block text-sm font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-1 rounded-full ${isPast ? 'bg-cyan-600' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══ SUCCESS SCREEN ════════════════════════════════════
  if (orderId) {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-emerald-500/30 relative">
            <CheckCircle2 size={48} strokeWidth={2.5} />
            <Sparkles size={24} className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Đặt hàng thành công!</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Đơn hàng <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">{orderId}</strong> của bạn đang chờ admin xác nhận.<br/>
            Sau khi được duyệt, tài liệu sẽ được mở khóa ngay lập tức.
          </p>
          <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 text-sm text-cyan-800 font-medium mb-8 flex items-center justify-center gap-3">
            <BadgeCheck size={20} className="text-cyan-600" />
            Theo dõi trạng thái tại phần Hồ sơ
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="px-6 py-3 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 transition-colors" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </button>
            <button className="px-6 py-3 rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2" onClick={() => navigate('/profile')}>
              Xem đơn hàng <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ═══ EMPTY CART ═══════════════════════════════════════
  if (displayCart.length === 0 && step === 'cart') {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center">
        <div className="bg-white p-10 sm:p-16 rounded-3xl border border-slate-200 border-dashed max-w-2xl w-full text-center">
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
            <ShoppingCart size={48} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Giỏ hàng đang trống</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Khám phá các môn học và thêm vào giỏ để bắt đầu hành trình học tập cùng TQMaster.</p>
          <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20 transition-all" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Khám phá khóa học
          </button>
        </div>
      </main>
    );
  }

  // ═══ ORDER SUMMARY (reused) ═══════════════════════════
  const SummaryCard = ({ showCoupon = false }: { showCoupon?: boolean }) => (
    <aside aria-labelledby="order-summary-heading" className="lg:col-span-4 sticky top-24 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-cyan-600">
              <Receipt size={20} />
            </span>
            <h2 className="text-lg font-bold text-slate-900" id="order-summary-heading">Tóm tắt đơn hàng</h2>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
            VND
          </span>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 tracking-wide uppercase text-sm">TQMASTER</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Chưa thanh toán</span>
          </div>
          <div className="text-slate-500 flex items-center justify-between pt-1">
            <span>Phiếu tạm tính:</span>
            <span className="font-mono text-slate-600">#TMP-{(Date.now().toString().slice(-6))}</span>
          </div>
          <div className="text-slate-500 flex items-center justify-between">
            <span>Phương thức nhận:</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Trực tuyến
            </span>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
          {displayCart.map((item, i) => {
            const c = subjectColor(item.name);
            return (
              <div key={item.id} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0" style={{ background: c + '20', color: c }}>
                    {subjectInitials(item.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{item.name}</div>
                    <div className="text-xs text-slate-400">Kỳ {item.semester}</div>
                  </div>
                </div>
                <div className="font-bold text-slate-900 text-sm shrink-0 pl-2">{formatPrice(Number(item.price))}</div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2.5 text-sm pt-2">
          <div className="flex justify-between text-slate-600">
            <span>Tạm tính ({displayCart.length} sản phẩm)</span>
            <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
          </div>
          {coupon && (
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1 text-emerald-600"><Tag size={14} /> {coupon.code}</span>
              <span className="font-medium text-emerald-600">-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span className="flex items-center gap-1">Phí giao dịch <span className="cursor-help text-slate-400">ⓘ</span></span>
            <span className="font-medium text-slate-900 text-xs uppercase px-1.5 py-0.5 bg-slate-100 rounded">Miễn phí</span>
          </div>

          <div className="pt-3 border-t border-slate-200 mt-2">
            <div className="bg-cyan-50/70 p-4 rounded-xl border border-cyan-100">
              <div className="text-xs font-semibold text-slate-600 mb-1">Tổng cộng thanh toán</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-cyan-700 tracking-tight">
                  {formatPrice(total).replace(' đ', '')} <span className="text-base font-bold underline">đ</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        {step === 'cart' && (
          <div className="space-y-3 pt-2">
            <button
              className="w-full group relative flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all duration-200 text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-cyan-500/30"
              onClick={() => setStep('checkout')}
            >
              <span>Tiến hành thanh toán</span>
              <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-xs text-slate-500 leading-relaxed">
              Bạn có thể nhập mã giảm giá ở bước tiếp theo.
            </p>
          </div>
        )}
        
        {step === 'checkout' && (
          <div className="space-y-3 pt-2">
            <button
              className="w-full group relative flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all duration-200 text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!fullName || !studentCode}
              onClick={() => setStep('confirm')}
            >
              <span>Xác nhận thông tin</span>
              <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="w-full py-2.5 px-6 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
              onClick={() => setStep('cart')}
            >
              <ArrowLeft size={16} /> Quay lại giỏ hàng
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3 pt-2">
            <button
              className="w-full group relative flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all duration-200 text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!transferred || !billFile || submitting}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              <span>{submitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}</span>
            </button>
            <button
              className="w-full py-2.5 px-6 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
              onClick={() => setStep('checkout')}
              disabled={submitting}
            >
              <ArrowLeft size={16} /> Sửa thông tin
            </button>
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mt-2">
              <Lock size={12} />
              <span>Thông tin thanh toán được mã hóa bảo mật</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  // ═══ CONFIRM (PAYMENT) STEP ═══════════════════════════
  if (step === 'confirm') {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Stepper current="confirm" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">Thanh toán chuyển khoản</h2>
              </div>

              <div className="p-6">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-1 mb-6">
                  {[
                    { label: 'Ngân hàng',     value: bankInfo['bank_name']    || '—', icon: Building2,   key: 'bank' },
                    { label: 'Số tài khoản',  value: bankInfo['bank_account'] || '—', icon: CreditCard,  key: 'acct', mono: true },
                    { label: 'Chủ tài khoản', value: bankInfo['bank_owner']   || '—', icon: User,        key: 'owner' },
                    { label: 'Nội dung CK',   value: transferContent,                  icon: ShieldCheck, key: 'note', mono: true, highlight: true },
                  ].map((row, i) => (
                    <div key={row.key} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 ${i !== 0 ? 'border-t border-slate-200' : ''}`}>
                      <div className="flex items-center gap-3 text-slate-500">
                        <row.icon size={18} className={row.highlight ? 'text-cyan-600' : ''} />
                        <span className="text-sm font-medium">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-3 sm:justify-end">
                        <strong className={`text-base font-bold text-slate-900 ${row.mono ? 'font-mono tracking-wide' : ''} ${row.highlight ? 'text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded' : ''}`}>
                          {row.value}
                        </strong>
                        <button
                          type="button"
                          onClick={() => copyText(row.value, row.key)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${copied === row.key ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          title="Sao chép"
                        >
                          {copied === row.key ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 border-t border-slate-200 bg-cyan-50/50 rounded-b-xl">
                    <div className="flex items-center gap-3 text-cyan-700">
                      <Banknote size={18} />
                      <span className="text-sm font-bold">Số tiền cần CK</span>
                    </div>
                    <strong className="text-2xl font-black text-cyan-700 font-mono">{formatPrice(total)}</strong>
                  </div>
                </div>

                {bankInfo['bank_qr_url'] && (
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border border-slate-200 rounded-xl mb-6 shadow-sm">
                    <div className="bg-white p-2 rounded-xl border-2 border-cyan-100 shadow-md shrink-0">
                      <img src={bankInfo['bank_qr_url']} alt="QR" className="w-40 h-40 object-contain" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Sparkles size={18} className="text-cyan-500" /> Quét mã QR thanh toán nhanh
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-4">Mở ứng dụng ngân hàng trên điện thoại, chọn tính năng quét mã QR và quét mã bên cạnh để thanh toán tự động.</p>
                      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800 border border-amber-200">
                        <Lock size={16} className="shrink-0 mt-0.5" />
                        <span>Vui lòng kiểm tra kỹ <strong>Nội dung chuyển khoản</strong> và <strong>Số tiền</strong> trước khi xác nhận để hệ thống duyệt tự động.</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-3">
                    <Upload size={16} className="text-cyan-600" /> Tải lên biên lai chuyển khoản <span className="text-rose-500">*</span>
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all ${billPreview ? 'border-cyan-400 bg-cyan-50/30' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-cyan-300'}`}
                  >
                    {billPreview ? (
                      <div className="relative inline-block">
                        <img src={billPreview} alt="Bill preview" className="max-h-64 rounded-lg shadow-sm" />
                        <button
                          onClick={(e) => { e.stopPropagation(); setBillFile(null); setBillPreview(null); }}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-cyan-600 shadow-sm mb-4">
                          <Upload size={28} />
                        </div>
                        <p className="text-base font-bold text-slate-800 mb-1">Nhấn để tải ảnh biên lai lên</p>
                        <p className="text-sm text-slate-500">Hỗ trợ JPG, PNG (tối đa 10MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 mt-0.5 cursor-pointer" checked={transferred} onChange={e => setTransferred(e.target.checked)} />
                    <span className="text-sm text-slate-700 leading-relaxed">
                      Tôi xác nhận đã chuyển khoản <strong>đúng số tiền</strong> và <strong>đúng nội dung</strong> như hướng dẫn. Tôi hiểu rằng việc nhập sai nội dung có thể làm chậm quá trình kích hoạt khóa học.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>
          
          <SummaryCard />
        </div>
      </main>
    );
  }

  // ═══ CHECKOUT (INFO) STEP ═════════════════════════════
  if (step === 'checkout') {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Stepper current="checkout" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Thông tin người học</h2>
                  <p className="text-xs text-slate-500">Thông tin này được dùng để cấp chứng nhận và kích hoạt bản quyền.</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên <span className="text-rose-500">*</span></label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                    value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nhập đầy đủ họ tên..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mã sinh viên / Mã học viên <span className="text-rose-500">*</span></label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all font-mono uppercase"
                    value={studentCode} onChange={e => setStudentCode(e.target.value)} placeholder="Ví dụ: HE181234"
                  />
                  <p className="text-xs text-slate-500 mt-2">Mã này sẽ là mã chính để Admin xác minh khi bạn chuyển khoản.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email liên hệ</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                    disabled value={profile?.email || ''}
                  />
                  <p className="text-xs text-slate-500 mt-2">Biên lai và hướng dẫn sẽ được gửi về email này.</p>
                </div>
              </div>
            </div>

            {/* Coupon Section directly in Checkout Info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4" htmlFor="coupon-input">
                <Tag size={18} className="text-cyan-600" /> Mã giảm giá / Voucher
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    id="coupon-input"
                    className={`w-full uppercase text-sm font-bold rounded-xl border px-4 py-3 outline-none transition-all ${
                      coupon ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : couponError ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                    }`}
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã ưu đãi..."
                    disabled={!!coupon}
                  />
                </div>
                {coupon ? (
                  <button className="px-6 py-3 text-sm font-bold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150" onClick={() => { setCoupon(null); setCouponCode(''); setCouponError(''); }}>
                    Hủy bỏ
                  </button>
                ) : (
                  <button className="px-6 py-3 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition duration-150 shadow-md disabled:opacity-50" onClick={applyCoupon} disabled={!couponCode}>
                    Áp dụng
                  </button>
                )}
              </div>
              {couponError && <p className="text-sm text-rose-500 mt-3 flex items-center gap-2"><X size={16} /> {couponError}</p>}
              {coupon && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2">
                  <p className="text-sm text-emerald-700 m-0 flex items-center gap-2 font-bold">
                    <CheckCircle2 size={18} /> Áp dụng mã thành công! Giảm {coupon.discount_type === 'percent' ? `${coupon.value}%` : formatPrice(Number(coupon.value))}
                  </p>
                  {(coupon.min_order_value || coupon.expires_at) && (
                    <div className="text-xs text-emerald-600 flex gap-4 flex-wrap mt-1 opacity-90">
                      {coupon.min_order_value && <span>• Đơn tối thiểu: <strong>{formatPrice(Number(coupon.min_order_value))}</strong></span>}
                      {coupon.expires_at && <span>• Hạn dùng: <strong>{new Date(coupon.expires_at).toLocaleDateString('vi-VN')}</strong></span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <SummaryCard />
        </div>
      </main>
    );
  }

  // ═══ CART STEP ════════════════════════════════════════
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" data-purpose="checkout-page-container">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Chi tiết giỏ hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Kiểm tra thông tin sản phẩm và áp dụng ưu đãi trước khi thanh toán.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
          <svg className="w-4 h-4 text-emerald-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          <span>Giao dịch an toàn & Mã hóa bảo mật 256-bit</span>
        </div>
      </div>
      
      <Stepper current="cart" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section aria-labelledby="cart-items-heading" className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900" id="cart-items-heading">Sản phẩm trong giỏ</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {displayCart.length} sản phẩm
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">{displayCart.length} mục sản phẩm số</span>
            </div>
            
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-slate-50/70 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-6">Sản phẩm</div>
              <div className="col-span-2 text-right">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Thành tiền</div>
            </div>
            
            <div className="p-6 divide-y divide-slate-100">
              {displayCart.map((item) => {
                const c = subjectColor(item.name);
                return (
                  <div key={item.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center py-4" data-purpose="cart-item-row">
                    <div className="w-full sm:col-span-6 flex items-start gap-4">
                      <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs flex items-center justify-center font-extrabold text-xl" style={{ background: `linear-gradient(135deg, ${c}30, ${c}10)`, color: c }}>
                        {subjectInitials(item.name)}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Zap size={10} className="mr-0.5" /> Kích hoạt ngay
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">Bản quyền số</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-cyan-600 transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Học kỳ: Kỳ {item.semester} • Truy cập vĩnh viễn</p>
                        
                        <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-500">Đơn giá: <strong className="text-slate-800">{formatPrice(Number(item.price))}</strong></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block sm:col-span-2 text-right">
                      <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{formatPrice(Number(item.price))}</span>
                    </div>
                    
                    <div className="w-full sm:w-auto sm:col-span-2 flex items-center justify-between sm:justify-center">
                      <span className="text-xs text-slate-500 sm:hidden">Số lượng:</span>
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 shadow-2xs opacity-80 cursor-not-allowed px-4 py-1.5">
                        <span className="text-sm font-bold text-slate-700">1</span>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-auto sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-500 sm:hidden">Tổng mục: </span>
                        <span className="text-base font-extrabold text-slate-900 whitespace-nowrap">{formatPrice(Number(item.price))}</span>
                      </div>
                      <div className="flex items-center">
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors" title="Xóa mục này">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="px-6 py-3.5 bg-cyan-50/60 border-t border-cyan-100 flex items-center gap-3 text-xs text-cyan-800">
              <span className="shrink-0 p-1.5 bg-cyan-100 rounded-md text-cyan-700">
                <CheckSquare size={14} />
              </span>
              <span>Hệ thống tự động kích hoạt và gửi thông tin hướng dẫn vào Email tài khoản ngay sau khi thanh toán thành công 24/7.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-full flex flex-col justify-between" data-purpose="security-guarantee">
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold shrink-0">✓</span>
                  <span>Bảo hành trọn thời gian sử dụng 1 đổi 1</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold shrink-0">✓</span>
                  <span>Hỗ trợ kỹ thuật trực tuyến 24/7 qua Facebook</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold shrink-0">✓</span>
                  <span>Hoàn tiền nếu dịch vụ gặp sự cố không thể khắc phục</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4">
                <button onClick={() => navigate('/')} className="inline-flex items-center text-xs font-bold text-cyan-700 hover:text-cyan-900 group">
                  <ArrowLeft size={14} className="mr-1 transform group-hover:-translate-x-0.5 transition-transform" />
                  Tiếp tục tìm kiếm môn học khác
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg text-white flex flex-col justify-center text-center">
              <Sparkles size={32} className="mx-auto mb-3 text-yellow-400" />
              <h3 className="font-bold text-lg mb-2">Ưu đãi độc quyền</h3>
              <p className="text-sm text-slate-300 mb-4 opacity-90">Nhập mã giảm giá ở bước tiếp theo để nhận ưu đãi lên đến 50% cho đơn hàng của bạn.</p>
              <button onClick={() => setStep('checkout')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl transition-colors border border-white/10 text-sm">
                Tiến hành thanh toán ngay
              </button>
            </div>
          </div>
        </section>
        
        <SummaryCard />
      </div>
    </main>
  );
}
