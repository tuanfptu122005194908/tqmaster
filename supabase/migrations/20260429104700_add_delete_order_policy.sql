-- Thêm quyền xoá đơn hàng cho admin
CREATE POLICY "admins_delete_orders" ON public.orders
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
