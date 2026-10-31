import { supabase } from '@/integrations/supabase/client';

export interface BillStats {
  totalWithBills: number;
  pendingWithBills: number;
  processedWithBills: number;
}

export interface CleanBillsResult {
  deletedFilesCount: number;
  updatedOrdersCount: number;
}

export type CleanBillScope = 'processed_only' | 'all';

/**
 * Lấy thống kê số lượng đơn hàng hiện đang có ảnh bill lưu trữ trên hệ thống.
 */
export async function fetchBillStats(): Promise<BillStats> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, bill_image_url')
    .not('bill_image_url', 'is', null);

  if (error) {
    throw new Error('Lỗi khi tải thống kê ảnh bill: ' + error.message);
  }

  const rows = (data || []).filter(r => typeof r.bill_image_url === 'string' && r.bill_image_url.trim() !== '');
  const totalWithBills = rows.length;
  const pendingWithBills = rows.filter(r => r.status === 'pending').length;
  const processedWithBills = rows.filter(r => r.status === 'approved' || r.status === 'rejected').length;

  return {
    totalWithBills,
    pendingWithBills,
    processedWithBills,
  };
}

/**
 * Xoá sạch file ảnh trong bucket `bill-images` và đặt lại `orders.bill_image_url = null`.
 * 
 * LƯU Ý AN TOÀN:
 * - Giữ nguyên 100% dữ liệu đơn hàng (id, số tiền, ngày duyệt, người duyệt).
 * - Tuyệt đối không xóa hay sửa quyền môn học trong `user_subjects`.
 */
export async function cleanBillImages(options: {
  scope: CleanBillScope;
  batchSize?: number;
}): Promise<CleanBillsResult> {
  const { scope, batchSize = 50 } = options;

  let query = supabase
    .from('orders')
    .select('id, bill_image_url, status')
    .not('bill_image_url', 'is', null);

  if (scope === 'processed_only') {
    query = query.in('status', ['approved', 'rejected']);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error('Không thể truy vấn danh sách đơn hàng có ảnh bill: ' + error.message);
  }

  const validOrders = (data || []).filter(
    (order): order is { id: string; bill_image_url: string; status: string } =>
      typeof order.bill_image_url === 'string' && order.bill_image_url.trim() !== ''
  );

  if (validOrders.length === 0) {
    return { deletedFilesCount: 0, updatedOrdersCount: 0 };
  }

  const paths = validOrders.map(o => o.bill_image_url);
  const orderIds = validOrders.map(o => o.id);

  // 1. Xoá file vật lý trong bucket `bill-images` theo batch
  let totalDeletedFiles = 0;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { data: removeData, error: removeError } = await supabase.storage
      .from('bill-images')
      .remove(batch);

    if (removeError) {
      console.warn(`[cleanBillImages] Cảnh báo xoá batch ảnh storage từ ${i}:`, removeError.message);
    } else {
      totalDeletedFiles += removeData?.length ?? batch.length;
    }
  }

  // 2. Cập nhật orders.bill_image_url = null theo batch
  let totalUpdatedOrders = 0;
  const updateBatchSize = 100;
  for (let i = 0; i < orderIds.length; i += updateBatchSize) {
    const idBatch = orderIds.slice(i, i + updateBatchSize);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ bill_image_url: null })
      .in('id', idBatch);

    if (updateError) {
      throw new Error('Lỗi khi cập nhật trạng thái ảnh đơn hàng: ' + updateError.message);
    }
    totalUpdatedOrders += idBatch.length;
  }

  return {
    deletedFilesCount: totalDeletedFiles,
    updatedOrdersCount: totalUpdatedOrders,
  };
}

