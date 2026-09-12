-- ==============================================================================
-- TRIGGER: Tự động thu hồi quyền môn học khi Đơn hàng bị Xoá hoặc Từ chối
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_order_subject_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Khi đơn được duyệt (status = 'approved'): Cấp quyền môn học
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
      INSERT INTO public.user_subjects (user_id, subject_id, granted_by)
      SELECT NEW.user_id, oi.subject_id, 'order'
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id
      ON CONFLICT (user_id, subject_id) DO NOTHING;
    END IF;

    -- 2. Khi đơn đang duyệt bị từ chối (status = 'rejected'): Thu hồi quyền môn học
    IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
      DELETE FROM public.user_subjects
      WHERE user_id = NEW.user_id
        AND subject_id IN (SELECT subject_id FROM public.order_items WHERE order_id = NEW.id)
        AND granted_by = 'order'
        AND subject_id NOT IN (
          SELECT oi.subject_id
          FROM public.orders o
          JOIN public.order_items oi ON oi.order_id = o.id
          WHERE o.user_id = NEW.user_id
            AND o.id <> NEW.id
            AND o.status = 'approved'
        );
    END IF;
    RETURN NEW;
  END IF;

  -- 3. Khi đơn hàng bị XOÁ (DELETE): Nếu đơn đã từng duyệt, thu hồi quyền trước khi xoá
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'approved' THEN
      DELETE FROM public.user_subjects
      WHERE user_id = OLD.user_id
        AND subject_id IN (SELECT subject_id FROM public.order_items WHERE order_id = OLD.id)
        AND granted_by = 'order'
        AND subject_id NOT IN (
          SELECT oi.subject_id
          FROM public.orders o
          JOIN public.order_items oi ON oi.order_id = o.id
          WHERE o.user_id = OLD.user_id
            AND o.id <> OLD.id
            AND o.status = 'approved'
        );
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Xóa trigger cũ
DROP TRIGGER IF EXISTS trg_order_approved ON public.orders;
DROP TRIGGER IF EXISTS trg_order_subject_access_update ON public.orders;
DROP TRIGGER IF EXISTS trg_order_subject_access_delete ON public.orders;

-- Bắt sự kiện UPDATE để cấp / thu hồi quyền
CREATE TRIGGER trg_order_subject_access_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_subject_access();

-- Bắt sự kiện BEFORE DELETE để thu hồi quyền trước khi order_items bị xoá
CREATE TRIGGER trg_order_subject_access_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_subject_access();
