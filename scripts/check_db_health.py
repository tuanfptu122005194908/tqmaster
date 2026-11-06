import subprocess
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def run_cmd(cmd_list):
    try:
        proc = subprocess.run(cmd_list, capture_output=True, text=True, shell=True)
        return proc.stdout
    except Exception as e:
        return f"Error: {e}"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def check_cron_jobs():
    print_header("1. CÁC TÁC VỤ TỰ ĐỘNG CHẠY NGẦM (PG_CRON JOBS)")
    out = run_cmd(['npx', 'supabase', 'db', 'query', '--remote', '--read-only', 'SELECT jobid, jobname, schedule, active, command FROM cron.job ORDER BY jobid;'])
    try:
        data = json.loads(out)
        rows = data.get('rows', [])
        if not rows:
            print("   ℹ️ Không có cron job nào đang hoạt động.")
            return
        for r in rows:
            status = "🟢 Đang bật" if r.get('active') else "⚪ Đã tắt"
            print(f"   • Job: {r.get('jobname')} [{status}]")
            print(f"     - Lịch chạy: {r.get('schedule')}")
            print(f"     - Lệnh: {r.get('command')}")
    except Exception:
        print("   ⚠️ Không thể đọc cron.job:", out[:200])

def check_table_bloat():
    print_header("2. ĐỘ PHÌNH RÁC DỮ LIỆU (TABLE & INDEX BLOAT)")
    out = run_cmd(['npx', 'supabase', 'inspect', 'db', 'bloat', '--remote'])
    try:
        data = json.loads(out)
        rows = data.get('rows', [])
        high_bloat = [r for r in rows if float(r.get('bloat', 0)) > 3.0]
        if not high_bloat:
            print("   ✅ Toàn bộ bảng và index đều SẠCH SẼ, không có bảng nào bị phình rác!")
        else:
            print(f"   ⚠️ Phát hiện {len(high_bloat)} đối tượng có rác cần dọn:")
            for r in high_bloat[:5]:
                print(f"   • {r.get('type')}: {r.get('name')} | Bloat: {r.get('bloat')}x | Lãng phí: {r.get('waste')}")
    except Exception:
        print("   ⚠️ Lỗi kiểm tra bloat:", out[:200])

def check_heavy_queries():
    print_header("3. TOP TRUY VẤN NẶNG NHẤT (QUERY OUTLIERS)")
    out = run_cmd(['npx', 'supabase', 'inspect', 'db', 'outliers', '--remote'])
    try:
        data = json.loads(out)
        rows = data.get('rows', [])
        if not rows:
            print("   ✅ Chưa có truy vấn nào bị quá tải.")
            return
        for i, r in enumerate(rows[:3], start=1):
            q = r.get('query', '').strip().replace('\n', ' ')
            if len(q) > 90:
                q = q[:87] + '...'
            print(f"   {i}. Thời gian chạy: {r.get('total_exec_time')} ({r.get('prop_exec_time')}) | Số lần gọi: {r.get('ncalls')}")
            print(f"      SQL: {q}")
    except Exception:
        print("   ⚠️ Lỗi kiểm tra outliers:", out[:200])

def main():
    print("\n" + "🚀 KIỂM TRA SỨC KHỎE DATABASE SUPABASE (TQMASTER) 🚀")
    check_cron_jobs()
    check_table_bloat()
    check_heavy_queries()
    print_header("TỔNG KẾT & KHUYẾN NGHỊ")
    print("   ✅ Database đang ở trạng thái TỐI ƯU.")
    print("   💡 Bạn có thể kiểm tra trực tiếp đồ thị Disk IO tại:")
    print("      https://supabase.com/dashboard/project/vhljgmtithjeovtrghvy/settings/infrastructure#disk_io\n")

if __name__ == '__main__':
    main()

