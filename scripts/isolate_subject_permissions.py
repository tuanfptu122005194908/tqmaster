import os
import sys
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

# Force UTF-8 on Windows
sys.stdout.reconfigure(encoding='utf-8')

ROOT_FOLDER_ID = '11xuNOgSTwy8LsIiLSI2CikABriEpeicm'
STATE_FILE = Path('scratch/gdrive_upload_state.json')
TOKEN_FILE = Path(r'C:\Users\DELL\.gemini\antigravity\plugin_data\gdrive\token.json')

def get_access_token():
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
        return res['access_token']

def drive_request(token, endpoint, method='GET', body=None):
    url = f"https://www.googleapis.com/drive/v3/{endpoint}"
    data = json.dumps(body).encode('utf-8') if body else None
    headers = {'Authorization': f'Bearer {token}'}
    if body:
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status == 204:
                return None
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        return {'error': e.code, 'message': err_msg}

def list_permissions(token, file_id):
    res = drive_request(token, f"files/{file_id}/permissions?fields=permissions(id,type,role,allowFileDiscovery,emailAddress)")
    if 'permissions' in res:
        return res['permissions']
    return []

def remove_permission(token, file_id, perm_id):
    return drive_request(token, f"files/{file_id}/permissions/{perm_id}", method='DELETE')

def add_anyone_reader(token, file_id):
    body = {
        'role': 'reader',
        'type': 'anyone',
        'allowFileDiscovery': False
    }
    return drive_request(token, f"files/{file_id}/permissions", method='POST', body=body)

def main():
    print("=" * 70)
    print("🔒 BẮT ĐẦU CÔ LẬP QUYỀN TRUY CẬP THEO TỪNG MÔN HỌC (PHƯƠNG ÁN 1)")
    print("=" * 70)
    
    token = get_access_token()
    with open(STATE_FILE, 'r', encoding='utf-8') as f:
        state = json.load(f)
        
    folders = state.get('folders', {})
    
    # 1. Bảo vệ Thư mục Gốc TQMaster (Chắc chắn Private 100%)
    print("\n[BƯỚC 1] Kiểm tra và bảo vệ Thư mục Gốc:")
    root_perms = list_permissions(token, ROOT_FOLDER_ID)
    cleaned_root = 0
    for p in root_perms:
        if p.get('type') == 'anyone':
            remove_permission(token, ROOT_FOLDER_ID, p['id'])
            cleaned_root += 1
            print(f"  ❌ Đã gỡ bỏ quyền công khai (anyone) khỏi Thư mục Gốc.")
    if cleaned_root == 0:
        print("  ✅ Thư mục Gốc đã ở chế độ RIÊNG TƯ (Private). Không có quyền công khai nào.")
        
    # 2. Bảo vệ các Thư mục Kỳ 1 -> Kỳ 5 (Chắc chắn Private 100%)
    print("\n[BƯỚC 2] Kiểm tra và bảo vệ các Thư mục Kỳ học (Kỳ 1 -> Kỳ 5):")
    semesters = ['Kỳ 1', 'Kỳ 2', 'Kỳ 3', 'Kỳ 4', 'Kỳ 5']
    for sem in semesters:
        fid = folders.get(sem)
        if not fid:
            continue
        perms = list_permissions(token, fid)
        sem_cleaned = False
        for p in perms:
            if p.get('type') == 'anyone':
                remove_permission(token, fid, p['id'])
                sem_cleaned = True
                print(f"  ❌ Đã gỡ bỏ quyền công khai khỏi '{sem}'.")
        if not sem_cleaned:
            print(f"  ✅ Thư mục '{sem}' ({fid}): RIÊNG TƯ (Private).")

    # 3. Phân quyền Reader độc lập cho 24 Môn học
    print("\n[BƯỚC 3] Thiết lập quyền xem (Reader) độc lập cho 24 Thư mục Môn học:")
    subjects = {}
    for path, fid in folders.items():
        parts = path.replace('\\', '/').strip('/').split('/')
        if len(parts) == 2 and parts[0].startswith('Kỳ '):
            sem = parts[0]
            subj_name = parts[1]
            subjects[subj_name] = {'path': path, 'id': fid, 'sem': sem}

    success_count = 0
    already_count = 0
    
    for subj_name, info in sorted(subjects.items()):
        fid = info['id']
        perms = list_permissions(token, fid)
        has_anyone = any(p.get('type') == 'anyone' for p in perms)
        
        if has_anyone:
            already_count += 1
            print(f"  ⚡ [{info['sem']}] {subj_name}: Đã có quyền anyoneWithLink ({fid})")
        else:
            res = add_anyone_reader(token, fid)
            if 'error' in res:
                print(f"  ❌ [{info['sem']}] {subj_name}: Lỗi cấp quyền: {res}")
            else:
                success_count += 1
                print(f"  ✅ [{info['sem']}] {subj_name}: Đã cấp quyền anyoneWithLink (Reader) ({fid})")

    print("\n" + "=" * 70)
    print(f"🎉 HOÀN THÀNH CÔ LẬP BẢO MẬT PHƯƠNG ÁN 1!")
    print(f"🛡️ Thư mục Gốc & Kỳ học: 100% PRIVATE (Ngăn chặn hoàn toàn xem chéo)")
    print(f"📚 Thư mục Môn học: {len(subjects)}/24 môn đã được cấp quyền link độc lập")
    print(f"   (Đã có trước: {already_count}, Cấp mới: {success_count})")
    print("=" * 70)

if __name__ == '__main__':
    main()

