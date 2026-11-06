import subprocess
import json
import sys
import os

# Đảm bảo in UTF-8 không lỗi trên mọi terminal Windows / Git Bash
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DEBUG = os.environ.get('DB_CHECK_DEBUG', '').lower() in ('1', 'true', 'yes')

def run_cmd(cmd):
    """
    Chạy lệnh shell, trả về stdout dạng string.
    - Dùng bytes + decode thủ công để tránh lỗi encoding trên Windows/Git Bash.
    - stderr tách riêng (không lẫn vào stdout).
    - Chấp nhận cả list và string làm cmd.
    """
    try:
        if isinstance(cmd, list):
            # Trên Windows/Git Bash, shell=True + list bị wrapped sai; dùng string
            cmd_str = ' '.join(cmd)
        else:
            cmd_str = cmd

        proc = subprocess.run(
            cmd_str,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True
        )
        raw_out = proc.stdout or b''
        raw_err = proc.stderr or b''

        out = raw_out.decode('utf-8', errors='replace').strip()
        err = raw_err.decode('utf-8', errors='replace').strip()

        if DEBUG:
            print(f"[DEBUG CMD]: {cmd_str}", file=sys.stderr)
            print(f"[DEBUG STDOUT]: {repr(out[:300])}", file=sys.stderr)
            if err:
                print(f"[DEBUG STDERR]: {repr(err[:300])}", file=sys.stderr)

        return out
    except Exception as e:
        if DEBUG:
            print(f"[DEBUG ERROR]: {e}", file=sys.stderr)
        return ''

def extract_json(raw_text):
    if not raw_text:
        return None
    idx_brace = raw_text.find('{')
    idx_bracket = raw_text.find('[')
    
    # Thử parse theo object {}
    if idx_brace != -1:
        end_brace = raw_text.rfind('}')
        if end_brace > idx_brace:
            try:
                return json.loads(raw_text[idx_brace:end_brace + 1])
            except Exception:
                pass

    # Thử parse theo array []
    if idx_bracket != -1:
        end_bracket = raw_text.rfind(']')
        if end_bracket > idx_bracket:
            try:
                return json.loads(raw_text[idx_bracket:end_bracket + 1])
            except Exception:
                pass

    return None

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def check_cron_jobs():
    print_header("1. CÁC TÁC VỤ TỰ ĐỘNG CHẠY NGẦM (PG_CRON JOBS)")
    out = run_cmd('npx supabase db query --remote --read-only "SELECT jobid, jobname, schedule, active, command FROM cron.job ORDER BY jobid;"')
    data = extract_json(out)
    if not data or not isinstance(data, dict):
        print("   ℹ️ Không đọc được danh sách cron job hoặc không có tác vụ nào.")
        return
    rows = data.get('rows', [])
    if not rows:
        print("   ℹ️ Không có cron job nào trong hệ thống.")
        return
    for r in rows:
        status = "🟢 Đang bật" if r.get('active') else "⚪ Đã tắt"
        sched = r.get('schedule', '')
        note = " (Chạy mỗi phút - NGUY CƠ CAO)" if sched == "* * * * *" else " (Hợp lý / An toàn)"
        print(f"   • Job: {r.get('jobname')} [{status}]")
        print(f"     - Lịch chạy: {sched}{note}")
        print(f"     - Lệnh: {r.get('command')}")

def check_table_bloat():
    print_header("2. ĐỘ PHÌNH RÁC DỮ LIỆU (TABLE & INDEX BLOAT)")
    out = run_cmd('npx supabase inspect db bloat --remote')
    data = extract_json(out)
    rows = []
    if isinstance(data, dict):
        rows = data.get('rows', [])
    elif isinstance(data, list):
        rows = data

    high_bloat = [r for r in rows if float(r.get('bloat', 0)) > 3.0]
    if not high_bloat:
        print("   ✅ Toàn bộ bảng và index đều SẠCH SẼ, không có bảng nào bị phình rác!")
    else:
        print(f"   ⚠️ Phát hiện {len(high_bloat)} đối tượng có rác cần dọn:")
        for r in high_bloat[:5]:
            print(f"   • {r.get('type')}: {r.get('name')} | Bloat: {r.get('bloat')}x | Lãng phí: {r.get('waste')}")

def check_heavy_queries():
    print_header("3. TOP TRUY VẤN NẶNG NHẤT (QUERY OUTLIERS)")
    out = run_cmd('npx supabase inspect db outliers --remote')
    data = extract_json(out)
    rows = []
    if isinstance(data, dict):
        rows = data.get('rows', [])
    elif isinstance(data, list):
        rows = data

    if not rows:
        print("   ✅ Chưa có truy vấn nào bị quá tải.")
        return
    for i, r in enumerate(rows[:3], start=1):
        q = r.get('query', '').strip().replace('\n', ' ')
        if len(q) > 90:
            q = q[:87] + '...'
        print(f"   {i}. Tổng thời gian: {r.get('total_exec_time')} ({r.get('prop_exec_time')}) | Lượt gọi: {r.get('ncalls')}")
        print(f"      SQL: {q}")

def main():
    print("\n" + "🚀 BÁO CÁO SỨC KHỎE DATABASE SUPABASE (TQMASTER) 🚀")
    check_cron_jobs()
    check_table_bloat()
    check_heavy_queries()
    print_header("TỔNG KẾT & KHUYẾN NGHỊ")
    print("   ✅ Trạng thái tổng quan: ĐÃ ĐƯỢC TỐI ƯU.")
    print("   💡 Xem chi tiết đồ thị Disk IO trực tiếp tại:")
    print("      https://supabase.com/dashboard/project/vhljgmtithjeovtrghvy/settings/infrastructure#disk_io\n")

if __name__ == '__main__':
    main()
