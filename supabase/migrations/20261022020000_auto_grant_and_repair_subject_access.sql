-- ==============================================================================
-- MIGRATION: Tự động cấp quyền khi tạo/duyệt đơn và khôi phục quyền môn học
-- ==============================================================================

-- 1. Nâng cấp trigger handle_order_subject_access() trên public.orders
CREATE OR REPLACE FUNCTION public.handle_order_subject_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A. Khi đơn được tạo mới trực tiếp ở trạng thái approved (INSERT)
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.user_subjects (user_id, subject_id, granted_by)
      SELECT NEW.user_id, oi.subject_id, 'order'
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id
      ON CONFLICT (user_id, subject_id) DO NOTHING;
    END IF;
    RETURN NEW;
  END IF;

  -- B. Khi đơn được cập nhật (UPDATE)
  IF TG_OP = 'UPDATE' THEN
    -- 1. Chuyển sang approved: Cấp quyền môn học
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
      INSERT INTO public.user_subjects (user_id, subject_id, granted_by)
      SELECT NEW.user_id, oi.subject_id, 'order'
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id
      ON CONFLICT (user_id, subject_id) DO NOTHING;
    END IF;

    -- 2. Chuyển từ approved sang rejected: Thu hồi quyền môn học
    -- (Trừ khi người dùng có một đơn hàng approved khác cũng chứa môn này)
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

  -- C. Khi đơn hàng bị XOÁ (DELETE): Thu hồi quyền nếu đơn đã từng duyệt
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

-- 2. Kích hoạt trigger trên public.orders cho cả INSERT và UPDATE
DROP TRIGGER IF EXISTS trg_order_subject_access_update ON public.orders;
DROP TRIGGER IF EXISTS trg_order_subject_access_change ON public.orders;

CREATE TRIGGER trg_order_subject_access_change
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_subject_access();

-- 3. Trigger trên order_items: Đảm bảo nếu order_items được chèn vào đơn đã approved thì tự cấp quyền
CREATE OR REPLACE FUNCTION public.handle_order_item_subject_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.orders o WHERE o.id = NEW.order_id AND o.status = 'approved') THEN
    INSERT INTO public.user_subjects (user_id, subject_id, granted_by)
    SELECT o.user_id, NEW.subject_id, 'order'
    FROM public.orders o
    WHERE o.id = NEW.order_id
    ON CONFLICT (user_id, subject_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_item_subject_access ON public.order_items;
CREATE TRIGGER trg_order_item_subject_access
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_item_subject_access();

-- 4. RPC Đối soát và Cấp bù quyền dành riêng cho Quản trị viên
CREATE OR REPLACE FUNCTION public.repair_subject_access_by_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
  v_inserted_count INT := 0;
  v_affected_users INT := 0;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Chưa xác thực danh tính. Vui lòng đăng nhập.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_caller_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Từ chối truy cập: Chỉ quản trị viên mới có quyền thực hiện thao tác này.';
  END IF;

  -- Đếm số user bị ảnh hưởng trước khi cấp bù
  WITH missing_grants AS (
    SELECT DISTINCT o.user_id, oi.subject_id
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    LEFT JOIN public.user_subjects us 
      ON us.user_id = o.user_id AND us.subject_id = oi.subject_id
    WHERE o.status = 'approved'
      AND us.id IS NULL
  )
  SELECT count(DISTINCT user_id) INTO v_affected_users FROM missing_grants;

  -- Thực hiện cấp bù vào user_subjects
  WITH inserted_rows AS (
    INSERT INTO public.user_subjects (user_id, subject_id, granted_by)
    SELECT DISTINCT o.user_id, oi.subject_id, 'order'
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    LEFT JOIN public.user_subjects us 
      ON us.user_id = o.user_id AND us.subject_id = oi.subject_id
    WHERE o.status = 'approved'
      AND us.id IS NULL
    ON CONFLICT (user_id, subject_id) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_inserted_count FROM inserted_rows;

  RETURN jsonb_build_object(
    'success', true,
    'restored_grants_count', v_inserted_count,
    'affected_users_count', v_affected_users
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.repair_subject_access_by_admin() TO authenticated;

-- 5. Thực hiện tự động nạp bù quyền cho các đơn hàng approved hiện có còn thiếu
INSERT INTO public.user_subjects (user_id, subject_id, granted_by)
SELECT DISTINCT o.user_id, oi.subject_id, 'order'
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
LEFT JOIN public.user_subjects us 
  ON us.user_id = o.user_id AND us.subject_id = oi.subject_id
WHERE o.status = 'approved' 
  AND us.id IS NULL
ON CONFLICT (user_id, subject_id) DO NOTHING;
