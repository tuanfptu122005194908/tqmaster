import os
import sys
import stat
import shutil
import zipfile
from pathlib import Path

# Force UTF-8 output on Windows
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

def force_delete_file(p: Path):
    """Safely delete a file even if marked read-only."""
    long_p = to_long_path(p)
    try:
        long_p.unlink()
    except PermissionError:
        long_p.chmod(stat.S_IWRITE)
        long_p.unlink()

def safe_extract_member(zf: zipfile.ZipFile, info: zipfile.ZipInfo, target_dir: Path):
    """Safely extract a member, preventing directory traversal and handling long paths."""
    rel_path = info.filename.replace('\\', '/').lstrip('/')
    if not rel_path:
        return False
        
    dest = target_dir / rel_path
    
    # Security check: ensure destination is within target_dir
    resolved_target = target_dir.resolve()
    resolved_dest = dest.resolve()
    try:
        resolved_dest.relative_to(resolved_target)
    except ValueError:
        raise RuntimeError(f"Zip slip security warning: {info.filename} escapes {target_dir}")

    long_dest = to_long_path(dest)
    
    if info.is_dir() or rel_path.endswith('/'):
        long_dest.mkdir(parents=True, exist_ok=True)
        return False
    else:
        to_long_path(long_dest.parent).mkdir(parents=True, exist_ok=True)
        with zf.open(info) as src, open(long_dest, 'wb') as dst:
            shutil.copyfileobj(src, dst)
        return True

def process_all_zips():
    if not BASE_DIR.exists():
        print(f"❌ Không tìm thấy thư mục: {BASE_DIR}")
        sys.exit(1)

    print(f"🚀 Bắt đầu giải nén và dọn dẹp các file ZIP trong: {BASE_DIR}")
    
    pass_number = 1
    total_zips_deleted = 0
    total_files_extracted = 0

    while True:
        # Find all zip files currently on disk
        zip_files = list(BASE_DIR.rglob('*.zip'))
        if not zip_files:
            break

        print(f"\n--- Đợt giải nén #{pass_number}: Tìm thấy {len(zip_files)} file .zip ---")
        extracted_in_this_pass = 0

        for zpath in zip_files:
            stem = zpath.stem
            parent_dir = zpath.parent

            try:
                files_count = 0
                with zipfile.ZipFile(to_long_path(zpath), 'r') as zf:
                    names = [n.replace('\\', '/').lstrip('/') for n in zf.namelist() if n]
                    has_files = any(not n.endswith('/') for n in names)
                    
                    if not has_files:
                        target_dir = parent_dir
                    elif all(n.split('/')[0].lower() == stem.lower() for n in names):
                        # All entries already reside in a root directory named `stem`
                        target_dir = parent_dir
                    else:
                        target_dir = parent_dir / stem

                    for info in zf.infolist():
                        if safe_extract_member(zf, info, target_dir):
                            files_count += 1

                # Delete zip file
                force_delete_file(zpath)
                total_zips_deleted += 1
                total_files_extracted += files_count
                extracted_in_this_pass += 1
                
                print(f"  ✓ Đã giải nén & xoá: {zpath.relative_to(BASE_DIR)} ({files_count} files)")
            except Exception as e:
                print(f"  ❌ Lỗi khi xử lý {zpath.name}: {e}")
                raise e

        pass_number += 1

    # Verify no zip files remain
    remaining_zips = list(BASE_DIR.rglob('*.zip'))
    
    # Calculate total size and file count
    all_files = [f for f in BASE_DIR.rglob('*') if f.is_file()]
    total_size_mb = sum(f.stat().st_size for f in all_files) / (1024 * 1024)

    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH TẤT CẢ CÁC ĐỢT GIẢI NÉN VÀ DỌN DẸP!")
    print(f"📁 Tổng số đợt thực hiện: {pass_number - 1}")
    print(f"🗑️ Tổng số file .zip đã giải nén và xoá bỏ: {total_zips_deleted}")
    print(f"📄 Tổng số file hiện có trong thư mục: {len(all_files)}")
    print(f"💾 Tổng dung lượng sau giải nén: {total_size_mb:.2f} MB")
    print(f"🔍 Số file .zip còn lại: {len(remaining_zips)}")
    print("=" * 60)

if __name__ == '__main__':
    process_all_zips()
