import os
import sys
import json
import shutil
import urllib.request
from pathlib import Path

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path('downloaded_theories').resolve()

def to_long_path(p: Path) -> Path:
    """Ensure Windows long path support (>260 chars) using \\\\?\\ prefix."""
    s = str(p.resolve())
    if os.name == 'nt' and not s.startswith('\\\\?\\'):
        if s.startswith('\\\\'):
            s = '\\\\?\\UNC\\' + s[2:]
        else:
            s = '\\\\?\\' + s
    return Path(s)

def get_subjects_mapping():
    keys_file = Path('scratch/keys.json')
    if not keys_file.exists():
        raise FileNotFoundError("Không tìm thấy file scratch/keys.json để lấy serviceRoleKey.")
    
    keys = json.loads(keys_file.read_text(encoding='utf-8'))
    service_key = keys.get('serviceRoleKey') or keys.get('service_role')
    
    req = urllib.request.Request(
        'https://vhljgmtithjeovtrghvy.supabase.co/rest/v1/subjects?select=name,semester',
        headers={
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}'
        }
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    
    norm_map = {}
    for s in data:
        name = s['name']
        clean_name = ' '.join(name.split()).lower()
        norm_map[clean_name] = (s['semester'], name)
    return norm_map

def organize():
    if not BASE_DIR.exists():
        print(f"❌ Không tìm thấy thư mục: {BASE_DIR}")
        sys.exit(1)

    print(f"🚀 Bắt đầu gom nhóm các môn học theo từng Kỳ học trong: {BASE_DIR}")
    norm_map = get_subjects_mapping()

    long_base = to_long_path(BASE_DIR)
    
    # Check what items are currently in root of BASE_DIR
    current_items = [d for d in long_base.iterdir() if d.is_dir()]
    unorganized_dirs = [d for d in current_items if not d.name.startswith('Kỳ ') and not d.name.startswith('Ky ')]

    print(f"📦 Tìm thấy {len(unorganized_dirs)} thư mục môn học cần gom nhóm vào các Kỳ.")

    moved_count = 0

    for d in sorted(unorganized_dirs, key=lambda x: x.name):
        clean_name = ' '.join(d.name.split()).lower()
        if clean_name not in norm_map:
            print(f"  ⚠️ Cảnh báo: Không tìm thấy kỳ cho môn '{d.name}'")
            continue

        sem, official_name = norm_map[clean_name]
        sem_folder_name = f"Kỳ {sem}"
        sem_dir = to_long_path(BASE_DIR / sem_folder_name)
        sem_dir.mkdir(parents=True, exist_ok=True)

        target_dir = to_long_path(BASE_DIR / sem_folder_name / d.name)
        
        # Move directory using shutil.move
        shutil.move(str(d), str(target_dir))
        moved_count += 1
        print(f"  ✓ Đã chuyển [{d.name}] ➡️ {sem_folder_name}/{d.name}")

    # Gather full summary of all semesters
    semester_stats = {}
    for sem_dir in sorted(long_base.iterdir()):
        if sem_dir.is_dir() and (sem_dir.name.startswith('Kỳ ') or sem_dir.name.startswith('Ky ')):
            subjects = [s.name for s in sem_dir.iterdir() if s.is_dir()]
            semester_stats[sem_dir.name] = subjects

    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH PHÂN LOẠI THEO KỲ HỌC!")
    print(f"📁 Tổng số môn vừa chuyển: {moved_count}")
    print("=" * 60)
    
    for sem in sorted(semester_stats.keys()):
        subjects = semester_stats[sem]
        print(f"\n📂 {sem} ({len(subjects)} môn):")
        for subj in sorted(subjects):
            # Count total files in this subject folder
            subj_path = to_long_path(BASE_DIR / sem / subj)
            files = [f for f in subj_path.rglob('*') if f.is_file()]
            size_mb = sum(f.stat().st_size for f in files) / (1024 * 1024)
            print(f"   ├── {subj:<42} ({len(files):>3} files, {size_mb:>5.2f} MB)")

if __name__ == '__main__':
    organize()
