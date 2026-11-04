import os
import sys
import json
import uuid
import time
import zipfile
import io
import urllib.request
import urllib.parse
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

TOKEN_FILE = Path(r'C:\Users\DELL\.gemini\antigravity\plugin_data\gdrive\token.json')
KEYS_FILE = Path('scratch/keys.json')
STATE_FILE = Path('scratch/gdrive_upload_state.json')

PRO192_SUBJECT_ID = '7af75eb1-b56d-4d46-8647-c9bfd9048d5e'
PRO192_COURSE_SUBJECT_ID = 'e6688086-7449-4d87-89df-9dfc4337582e'
PRO192_GDRIVE_PARENT_ID = '169DaNM4A1jxlS4u_3bX0fOg28z2zkFSv'  # Kỳ 2/PRO192
ADMIN_USER_ID = 'd6b4218e-9081-4fcd-b19f-f7854bf147dd'
SUPABASE_URL = 'https://vhljgmtithjeovtrghvy.supabase.co'

EXAMS_TO_PROCESS = [
    {
        'local_dir': 'PRO192 - SU26 - B1 - PE - Paper 10 [6984]',
        'title': 'Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_10',
        'zip_name': 'Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_10.zip',
    },
    {
        'local_dir': 'PRO192 - SU26 - B1 - PE - Paper 9 [7044]',
        'title': 'Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_9',
        'zip_name': 'Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_9.zip',
    },
    {
        'local_dir': 'PRO192 - SU26 - B5 - PE - NO2 [FuExam-1215]',
        'title': 'Đề_Thi_PE_-_PRO192_-_SU26_-_B5_-_NO2',
        'zip_name': 'Đề_Thi_PE_-_PRO192_-_SU26_-_B5_-_NO2.zip',
    },
    {
        'local_dir': 'PRO192 - SU26 - PE - Paper 2 [7011]',
        'title': 'Đề_Thi_PE_-_PRO192_-_SU26_-_Paper_2',
        'zip_name': 'Đề_Thi_PE_-_PRO192_-_SU26_-_Paper_2.zip',
    },
]

def get_access_token():
    tok_data = json.loads(TOKEN_FILE.read_text(encoding='utf-8'))
    data = urllib.parse.urlencode({
        'client_id': tok_data['client_id'],
        'client_secret': tok_data['client_secret'],
        'refresh_token': tok_data['token']['refresh_token'],
        'grant_type': 'refresh_token'
    }).encode('utf-8')
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))['access_token']

def drive_create_folder(token, name, parent_id):
    url = "https://www.googleapis.com/drive/v3/files"
    body = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_id]
    }
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))['id']

def drive_set_public_read(token, file_id):
    url = f"https://www.googleapis.com/drive/v3/files/{file_id}/permissions"
    body = {'role': 'reader', 'type': 'anyone'}
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"  [warn] set public read: {e}")
        return None

def drive_upload_file(token, file_bytes, filename, parent_id, mimetype='application/octet-stream'):
    metadata = {'name': filename, 'parents': [parent_id]}
    boundary = '-------314159265358979323846'
    parts = []
    parts.append(f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{json.dumps(metadata)}\r\n'.encode('utf-8'))
    parts.append(f'--{boundary}\r\nContent-Type: {mimetype}\r\n\r\n'.encode('utf-8'))
    parts.append(file_bytes)
    parts.append(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
    payload = b''.join(parts)
    
    url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
    req = urllib.request.Request(url, data=payload, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/related; boundary={boundary}'
    }, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))['id']

def upload_to_supabase_storage(service_key, file_bytes, path, content_type='image/webp'):
    url = f"{SUPABASE_URL}/storage/v1/object/theory-images/{path}"
    req = urllib.request.Request(
        url,
        data=file_bytes,
        headers={
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Content-Type': content_type,
            'x-upsert': 'true',
            'cache-control': '31536000'
        },
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("🚀 Bắt đầu tải các đề thi PE PRO192 lên Google Drive & Supabase...")
    keys = json.loads(KEYS_FILE.read_text(encoding='utf-8'))
    service_key = keys['serviceRoleKey']
    token = get_access_token()
    
    state = {}
    if STATE_FILE.exists():
        state = json.loads(STATE_FILE.read_text(encoding='utf-8'))
    if 'folders' not in state:
        state['folders'] = {}
    if 'files' not in state:
        state['files'] = {}
    if 'theories' not in state:
        state['theories'] = {}

    base_dir = Path('downloaded_theories')
    
    created_theories = []

    for item in EXAMS_TO_PROCESS:
        folder_path = base_dir / item['local_dir']
        if not folder_path.exists():
            print(f"❌ Không tìm thấy thư mục: {folder_path}")
            continue

        title = item['title']
        zip_name = item['zip_name']
        theory_id = str(uuid.uuid4())
        print(f"\n==========================================")
        print(f"📦 Xử lý: {title}")
        print(f"🔑 Theory ID: {theory_id}")
        
        # 1. Thu thập files
        all_files = sorted(list(folder_path.iterdir()), key=lambda p: p.name)
        image_files = [f for f in all_files if f.suffix.lower() in ['.webp', '.png', '.jpg', '.jpeg']]
        other_files = [f for f in all_files if f not in image_files]
        print(f"📸 Tìm thấy {len(image_files)} ảnh câu hỏi và {len(other_files)} file đính kèm khác.")

        # 2. Tạo file ZIP tổng hợp cho đề thi (để học sinh tải về trọn bộ)
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for f in all_files:
                zf.write(f, arcname=f.name)
        zip_bytes = zip_buffer.getvalue()
        print(f"🗜️ Tạo file zip trọn bộ: {zip_name} ({len(zip_bytes)} bytes)")

        # 3. Tạo thư mục trên Google Drive bên trong Kỳ 2/PRO192
        drive_folder_id = drive_create_folder(token, title, PRO192_GDRIVE_PARENT_ID)
        drive_set_public_read(token, drive_folder_id)
        drive_folder_url = f"https://drive.google.com/drive/folders/{drive_folder_id}"
        print(f"📁 Đã tạo thư mục Google Drive: {drive_folder_url}")
        state['folders'][f"Kỳ 2/PRO192/{title}"] = drive_folder_id

        # 4. Tải tất cả các file lên Google Drive
        for f in all_files:
            mimetype = 'image/webp' if f.suffix.lower() == '.webp' else 'application/zip' if f.suffix.lower() == '.zip' else 'application/octet-stream'
            fid = drive_upload_file(token, f.read_bytes(), f.name, drive_folder_id, mimetype)
            state['files'][f"Kỳ 2/PRO192/{title}/{f.name}"] = fid
            print(f"   ⬆️ Drive: {f.name}")
        
        # Tải luôn file ZIP trọn bộ lên thư mục Drive
        zip_fid = drive_upload_file(token, zip_bytes, zip_name, drive_folder_id, 'application/zip')
        state['files'][f"Kỳ 2/PRO192/{title}/{zip_name}"] = zip_fid
        print(f"   ⬆️ Drive (Trọn bộ ZIP): {zip_name}")

        # 5. Tải ảnh preview câu hỏi lên Supabase Storage bucket `theory-images`
        preview_urls = []
        now_ts = int(time.time() * 1000)
        for idx, img_path in enumerate(image_files, start=1):
            clean_name = f"q{idx}.webp"
            storage_path = f"pe-extracts/{theory_id}/{idx:02d}_{now_ts}_{clean_name}"
            upload_to_supabase_storage(service_key, img_path.read_bytes(), storage_path, 'image/webp')
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/theory-images/{storage_path}"
            preview_urls.append(public_url)
            print(f"   🖼️ Storage: {clean_name} -> {public_url[:75]}...")

        # 6. Tạo metadata JSON description
        pe_meta = json.dumps({'preview_images': preview_urls})
        description = f"<!--PE_META:{pe_meta}-->"

        # 7. Lưu vào bảng theories trong Supabase
        theory_payload = {
            'id': theory_id,
            'title': title,
            'description': description,
            'type': 'file',
            'url': drive_folder_url,
            'file_name': zip_name,
            'category': 'pe',
            'sort_order': 0,
            'created_by': ADMIN_USER_ID,
        }
        insert_req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/theories",
            data=json.dumps(theory_payload).encode('utf-8'),
            headers={
                'apikey': service_key,
                'Authorization': f'Bearer {service_key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            method='POST'
        )
        with urllib.request.urlopen(insert_req) as resp:
            inserted_theory = json.loads(resp.read().decode('utf-8'))
            print(f"✅ Đã thêm vào theories: {inserted_theory[0]['id']}")

        # 8. Liên kết vào theory_subjects cho cả PRO192 và PRO192 (Khoá Học)
        for sub_id, sub_label in [(PRO192_SUBJECT_ID, 'PRO192'), (PRO192_COURSE_SUBJECT_ID, 'PRO192 (Khoá Học)')]:
            ts_payload = {
                'theory_id': theory_id,
                'subject_id': sub_id
            }
            ts_req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/theory_subjects",
                data=json.dumps(ts_payload).encode('utf-8'),
                headers={
                    'apikey': service_key,
                    'Authorization': f'Bearer {service_key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                method='POST'
            )
            with urllib.request.urlopen(ts_req) as resp:
                json.loads(resp.read().decode('utf-8'))
                print(f"🔗 Đã liên kết theory {theory_id} với môn {sub_label} ({sub_id})")

        state['theories'][theory_id] = drive_folder_url
        created_theories.append({
            'id': theory_id,
            'title': title,
            'url': drive_folder_url,
            'images_count': len(preview_urls)
        })

    # Cập nhật state file
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"\n🎉 HOÀN THÀNH TOÀN BỘ 4 ĐỀ THI PE CHO PRO192!")
    for item in created_theories:
        print(f"⭐ {item['title']} ({item['images_count']} ảnh): {item['url']}")

if __name__ == '__main__':
    main()

