import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const oldAdminId = '09930854-0481-4bd4-b728-37c258670e28';
const newAdminId = 'd6b4218e-9081-4fcd-b19f-f7854bf147dd';

let header = `-- ==============================================================================
-- TQMASTER - NẠP TOÀN BỘ NGƯỜI DÙNG, PHÂN QUYỀN, ĐƠN HÀNG & MÔN HỌC ĐÃ MUA
-- Chạy file này trên Supabase SQL Editor để cập nhật Báo cáo Hệ thống & Dashboard.
-- Dung lượng: ~930 KB (chạy trong 3 giây trên SQL Editor, không bị quá giới hạn web)
-- ==============================================================================

BEGIN;
SET session_replication_role = replica; -- Tạm tắt kiểm tra khóa ngoại & trigger

-- 1. Gỡ tạm ràng buộc khóa ngoại tới auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 2. Dọn sạch profile admin tạm & role tạm
DELETE FROM public.user_roles WHERE role = 'admin' OR user_id = '${newAdminId}';
DELETE FROM public.profiles WHERE username = 'admin' OR email = 'admin@gmail.com' OR id = '${newAdminId}';
DELETE FROM public.user_subjects WHERE user_id = '${newAdminId}';

`;

const files = [
  '01_profiles.sql',
  '02_user_roles.sql',
  '10_user_subjects.sql',
  '12_orders.sql',
  '13_order_items.sql'
];

let body = '';

for (const f of files) {
  let content = fs.readFileSync(path.join(__dirname, '../backup_sql', f), 'utf8');
  content = content.replace(/^--[^\n]*\n/gm, '');
  content = content.replace(/^BEGIN;\n/gm, '');
  content = content.replace(/^SET session_replication_role[^\n]*;\n/gm, '');
  content = content.replace(/^COMMIT;\n/gm, '');
  content = content.replace(/ALTER TABLE public\.profiles DROP CONSTRAINT[^\n]*;\n/g, '');
  content = content.replace(/DELETE FROM public\.profiles WHERE[^\n]*;\n/g, '');
  content = content.replace(/ALTER TABLE public\.user_roles DROP CONSTRAINT[^\n]*;\n/g, '');
  content = content.replace(/DELETE FROM public\.user_roles WHERE[^\n]*;\n/g, '');

  // Sửa conflict target chuẩn cho từng bảng
  if (f === '02_user_roles.sql') {
    content = content.replace(/ON CONFLICT \([^)]+\) DO NOTHING/g, 'ON CONFLICT (user_id, role) DO NOTHING');
  } else if (f === '10_user_subjects.sql') {
    content = content.replace(/ON CONFLICT \([^)]+\) DO NOTHING/g, 'ON CONFLICT (user_id, subject_id) DO NOTHING');
  }

  // Map old admin ID to new admin ID
  content = content.split(oldAdminId).join(newAdminId);
  // Map old storage domain
  content = content.split('https://jokmwkkepasocfpcsmzd.supabase.co').join('https://vhljgmtithjeovtrghvy.supabase.co');

  body += content.trim() + '\n\n';
}

const footer = `
-- 3. Đảm bảo tài khoản admin hiện tại có quyền admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('${newAdminId}', 'admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;

SET session_replication_role = origin;
COMMIT;
`;

const finalSql = header + body + footer;
const outPath = path.join(__dirname, '../backup_sql/NAP_NGUOI_DUNG_VA_DON_HANG.sql');
fs.writeFileSync(outPath, finalSql, 'utf8');

const stat = fs.statSync(outPath);
console.log('✅ Cập nhật thành công file:', outPath);
console.log(`Dung lượng: ${(stat.size / 1024).toFixed(2)} KB`);
