import os
import sys
import json
import time
import mimetypes
import threading
import urllib.request
import urllib.parse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Force UTF-8 on Windows
sys.stdout.reconfigure(encoding='utf-8')

ROOT_FOLDER_ID = '11xuNOgSTwy8LsIiLSI2CikABriEpeicm'
BASE_DIR = Path('downloaded_theories').resolve()
STATE_FILE = Path('scratch/gdrive_upload_state.json')
KEYS_FILE = Path('scratch/keys.json')
TOKEN_FILE = Path(r'C:\Users\DELL\.gemini\antigravity\plugin_data\gdrive\token.json')

token_lock = threading.Lock()
current_access_token = None
token_expiry = 0

def to_long_path(p: Path) -> Path:
    """Ensure Windows long path support (>260 chars) using \\\\?\\ prefix."""
    s = str(p.resolve())
    if os.name == 'nt' and not s.startswith('\\\\?\\'):
        if s.startswith('\\\\'):
            s = '\\\\?\\UNC\\' + s[2:]
        else:
            s = '\\\\?\\' + s
    return Path(s)

def load_keys():
    if not KEYS_FILE.exists():
        raise FileNotFoundError("scratch/keys.json not found")
    return json.loads(KEYS_FILE.read_text(encoding='utf-8'))

def get_access_token():
    global current_access_token, token_expiry
    with token_lock:
        now = time.time()
        if current_access_token and now < token_expiry - 120:
            return current_access_token
        
        tok_data = json.loads(TOKEN_FILE.read_text(encoding='utf-8'))
        client_id = tok_data['client_id']
        client_secret = tok_data['client_secret']
        refresh_token = tok_data['token']['refresh_token']
        
        data = urllib.parse.urlencode({
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }).encode('utf-8')
        
        req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            current_access_token = res['access_token']
            expires_in = res.get('expires_in', 3600)
            token_expiry = now + expires_in
            return current_access_token

def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding='utf-8'))
        except Exception:
            pass
    return {'folders': {}, 'files': {}, 'theories': {}}

def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = STATE_FILE.with_suffix(f'.tmp_{os.getpid()}')
    temp_file.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding='utf-8')
    temp_file.replace(STATE_FILE)

def drive_api_request(url, data=None, headers=None, method='GET', retries=5):
    for attempt in range(1, retries + 1):
        token = get_access_token()
        req_headers = {'Authorization': f'Bearer {token}'}
        if headers:
            req_headers.update(headers)
        req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                if resp.status == 204:
                    return None
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 401 and attempt < retries:
                with token_lock:
                    global current_access_token, token_expiry
                    current_access_token = None
                    token_expiry = 0
                time.sleep(1)
                continue
            if (e.code in [429, 500, 502, 503, 504]) and attempt < retries:
                time.sleep(1.5 ** attempt)
                continue
            body = e.read().decode('utf-8', errors='ignore')
            raise RuntimeError(f"HTTP {e.code} for {url}: {body}")
        except Exception as e:
            if attempt < retries:
                time.sleep(1.5 ** attempt)
                continue
            raise e

def create_drive_folder(name, parent_id):
    metadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_id]
    }
    res = drive_api_request(
        'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
        data=json.dumps(metadata).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    return res['id']

def upload_file_multipart(local_path, file_name, parent_id):
    mime_type, _ = mimetypes.guess_type(file_name)
    if not mime_type:
        mime_type = 'application/octet-stream'

    boundary = f'-------antigravity_{int(time.time()*1000)}'
    delimiter = f'\r\n--{boundary}\r\n'.encode('utf-8')
    close_delim = f'\r\n--{boundary}--\r\n'.encode('utf-8')

    metadata = {
        'name': file_name,
        'parents': [parent_id]
    }
    metadata_part = ('Content-Type: application/json; charset=UTF-8\r\n\r\n' + json.dumps(metadata)).encode('utf-8')
    media_part_header = f'Content-Type: {mime_type}\r\n\r\n'.encode('utf-8')

    with open(to_long_path(local_path), 'rb') as f:
        file_bytes = f.read()

    body = delimiter + metadata_part + delimiter + media_part_header + file_bytes + close_delim

    res = drive_api_request(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
        data=body,
        headers={
            'Content-Type': f'multipart/related; boundary={boundary}',
            'Content-Length': str(len(body))
        },
        method='POST'
    )
    return res['id']

def sync_all_folders_parallel(state, max_workers=16):
    """Create all directories on Drive depth-by-depth in parallel."""
    print("📁 [1/3] Đang đồng bộ cấu trúc thư mục lên Google Drive (song song 16 luồng)...")
    
    state['folders']['.'] = ROOT_FOLDER_ID
    
    all_dirs = []
    for root, dirs, _ in os.walk(BASE_DIR):
        for d in dirs:
            dir_path = Path(root) / d
            rel = dir_path.relative_to(BASE_DIR).as_posix()
            all_dirs.append(rel)
            
    # Group directories by depth
    depth_groups = {}
    for d in all_dirs:
        depth = len(d.split('/'))
        if depth not in depth_groups:
            depth_groups[depth] = []
        depth_groups[depth].append(d)

    total_needed = sum(1 for d in all_dirs if d not in state['folders'])
    print(f"   Tổng số thư mục: {len(all_dirs)} (Đã tạo trước: {len(state['folders']) - 1}, Còn lại: {total_needed})")

    lock = threading.Lock()
    created_count = 0

    for depth in sorted(depth_groups.keys()):
        dirs_at_depth = depth_groups[depth]
        needed = [d for d in dirs_at_depth if d not in state['folders']]
        if not needed:
            continue

        print(f"   📂 Cấp {depth}: Đang tạo {len(needed)} thư mục song song...")

        def create_worker(rel_dir):
            nonlocal created_count
            parts = rel_dir.split('/')
            folder_name = parts[-1]
            parent_rel = '/'.join(parts[:-1]) if len(parts) > 1 else '.'
            
            parent_id = state['folders'].get(parent_rel)
            if not parent_id:
                raise RuntimeError(f"Lỗi: Parent ID chưa có cho {parent_rel}")

            folder_id = create_drive_folder(folder_name, parent_id)
            with lock:
                state['folders'][rel_dir] = folder_id
                created_count += 1

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(create_worker, d) for d in needed]
            for future in as_completed(futures):
                future.result()

        save_state(state)
        print(f"   ✓ Cấp {depth} hoàn thành (Đã tạo xong {len(state['folders'])} thư mục)")

    save_state(state)
    print(f"✅ Hoàn tất cấu trúc thư mục! ({len(state['folders'])} thư mục đã sẵn sàng)")

def sync_all_files(state, max_workers=16):
    """Upload all files concurrently with thread pool."""
    print(f"\n📤 [2/3] Đang tải lên toàn bộ file với {max_workers} luồng xử lý song song...")

    all_files_to_upload = []
    for root, _, files in os.walk(BASE_DIR):
        for f in files:
            if f.lower().endswith(('.exe', '.rar', '.zip')):
                continue
            file_path = Path(root) / f
            rel = file_path.relative_to(BASE_DIR).as_posix()
            if rel not in state['files']:
                parent_rel = file_path.parent.relative_to(BASE_DIR).as_posix()
                all_files_to_upload.append((file_path, f, rel, parent_rel))

    total = len(all_files_to_upload)
    already_done = len(state['files'])
    print(f"   Tổng số file: {total + already_done} (Đã có sẵn: {already_done}, Cần tải: {total})")

    if total == 0:
        print("✅ Tất cả các file đã được tải lên trước đó!")
        return

    lock = threading.Lock()
    completed_count = 0
    total_bytes = 0

    def worker(item):
        nonlocal completed_count, total_bytes
        file_path, file_name, rel_file, parent_rel = item
        parent_id = state['folders'].get(parent_rel)
        if not parent_id:
            raise RuntimeError(f"Thiếu parent folder ID cho {parent_rel}")

        file_id = upload_file_multipart(file_path, file_name, parent_id)
        file_size = to_long_path(file_path).stat().st_size
        
        with lock:
            state['files'][rel_file] = file_id
            completed_count += 1
            total_bytes += file_size
            if completed_count % 50 == 0 or completed_count == total:
                save_state(state)
                mb = total_bytes / (1024 * 1024)
                pct = (completed_count / total) * 100
                print(f"   ✓ Đã tải {completed_count}/{total} files ({pct:.1f}% - {mb:.2f} MB)...", flush=True)
        return file_id

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(worker, item) for item in all_files_to_upload]
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"❌ Lỗi tải file: {e}")
                save_state(state)
                raise e

    save_state(state)
    print(f"✅ Đã tải lên toàn bộ {total} files thành công!")

def update_supabase_theories(state):
    """Map every theory record to its Google Drive folder/file URL and update Supabase."""
    print("\n🔄 [3/3] Đang cập nhật liên kết Google Drive vào cơ sở dữ liệu Supabase...")
    keys = load_keys()
    service_key = keys['serviceRoleKey']

    req = urllib.request.Request(
        'https://vhljgmtithjeovtrghvy.supabase.co/rest/v1/theories?select=id,title,file_name,url,theory_subjects(subjects(name,semester))&type=eq.file',
        headers={'apikey': service_key, 'Authorization': f'Bearer {service_key}'}
    )
    with urllib.request.urlopen(req) as resp:
        theories = json.loads(resp.read().decode('utf-8'))

    print(f"   Tìm thấy {len(theories)} tài liệu lý thuyết / đề thi cần cập nhật link.")

    updated_count = 0
    for t in theories:
        t_id = t['id']
        subjects = [ts['subjects']['name'] for ts in t.get('theory_subjects', []) if ts.get('subjects')]
        if not subjects:
            subjects = ['Tai_Lieu_Chung']

        candidates = []
        if t.get('file_name'):
            candidates.append(Path(t['file_name']).stem)
            candidates.append(t['file_name'])
        if t.get('title'):
            candidates.append(t['title'])
        if t.get('url'):
            candidates.append(Path(t['url']).name)
            candidates.append(Path(t['url']).stem)

        drive_url = None

        for sub in subjects:
            for sem_dir in BASE_DIR.iterdir():
                if not sem_dir.is_dir() or not sem_dir.name.startswith('Kỳ '):
                    continue
                sub_dir = sem_dir / sub
                if not sub_dir.is_dir():
                    continue

                for cand in candidates:
                    cand_clean = cand.replace(':', '_').replace('/', '_').replace('\\', '_').strip()
                    cand_path = sub_dir / cand_clean
                    if not cand_path.exists():
                        cand_path = sub_dir / cand
                    
                    if cand_path.exists():
                        rel = cand_path.relative_to(BASE_DIR).as_posix()
                        if cand_path.is_dir() and rel in state['folders']:
                            folder_id = state['folders'][rel]
                            drive_url = f"https://drive.google.com/drive/folders/{folder_id}"
                            break
                        elif cand_path.is_file() and rel in state['files']:
                            file_id = state['files'][rel]
                            drive_url = f"https://drive.google.com/file/d/{file_id}/view"
                            break

                if not drive_url:
                    rel_sub = sub_dir.relative_to(BASE_DIR).as_posix()
                    if rel_sub in state['folders']:
                        sub_folder_id = state['folders'][rel_sub]
                        drive_url = f"https://drive.google.com/drive/folders/{sub_folder_id}"

                if drive_url:
                    break
            if drive_url:
                break

        if not drive_url:
            drive_url = f"https://drive.google.com/drive/folders/{ROOT_FOLDER_ID}"

        update_data = json.dumps({'url': drive_url}).encode('utf-8')
        patch_req = urllib.request.Request(
            f"https://vhljgmtithjeovtrghvy.supabase.co/rest/v1/theories?id=eq.{t_id}",
            data=update_data,
            headers={
                'apikey': service_key,
                'Authorization': f'Bearer {service_key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            method='PATCH'
        )
        with urllib.request.urlopen(patch_req) as p_resp:
            pass

        state['theories'][t_id] = drive_url
        updated_count += 1

    save_state(state)
    print(f"✅ Đã cập nhật thành công {updated_count}/{len(theories)} tài liệu trong database Supabase!")

def main():
    start_time = time.time()
    state = load_state()

    print("=" * 60)
    print("🚀 BẮT ĐẦU ĐẨY TOÀN BỘ TÀI LIỆU LÊN GOOGLE DRIVE (TỐC ĐỘ CAO 16 LUỒNG)")
    print(f"📂 Thư mục gốc Google Drive: https://drive.google.com/drive/folders/{ROOT_FOLDER_ID}")
    print("=" * 60)

    # 1. Sync all folder structure parallel depth-by-depth
    sync_all_folders_parallel(state, max_workers=16)

    # 2. Upload all files parallel
    sync_all_files(state, max_workers=16)

    # 3. Update Supabase Database
    update_supabase_theories(state)

    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print("🎉 HOÀN TẤT 100% CẢ QUÁ TRÌNH TẢI LÊN VÀ CẬP NHẬT!")
    print(f"⏱️ Tổng thời gian thực hiện: {elapsed:.1f} giây ({elapsed/60:.2f} phút)")
    print(f"📁 Tổng số thư mục trên Drive: {len(state['folders'])}")
    print(f"📄 Tổng số file đã tải lên: {len(state['files'])}")
    print(f"🔗 Tổng số theories đã cập nhật link: {len(state['theories'])}")
    print(f"🌐 Link Drive tổng: https://drive.google.com/drive/folders/{ROOT_FOLDER_ID}")
    print("=" * 60)

if __name__ == '__main__':
    main()
