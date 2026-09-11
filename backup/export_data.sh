#!/usr/bin/env bash
# Xuat toan bo du lieu database ra file SQL (INSERT) de chay trong Supabase SQL Editor.
# Ket qua duoc ghi ra /mnt/documents/backup (KHONG ghi vao repo vi file rat lon).
#
# Dung:
#   bash backup/export_data.sh                 # ghi ra /mnt/documents/backup
#   bash backup/export_data.sh <thu_muc>
#   PGURL="postgresql://..." bash backup/export_data.sh
set -euo pipefail

DIR="${1:-/mnt/documents/backup}"
PGURL="${PGURL:-${SUPABASE_DB_URL:-}}"
PSQL=(psql)
[ -n "$PGURL" ] && PSQL=(psql "$PGURL")

command -v psql >/dev/null || { echo "Thieu psql. Cai dat truoc khi chay."; exit 1; }
"${PSQL[@]}" -At -c 'select 1' >/dev/null || { echo "Khong ket noi duoc database."; exit 1; }

mkdir -p "$DIR"

# Thu tu ton trong khoa ngoai. Bang signup_otps (ma OTP tam) co tinh bao mat -> khong xuat.
TABLES=(
  profiles user_roles subjects exams exam_subjects questions question_options
  theories theory_subjects user_subjects discount_codes orders order_items
  exam_attempts attempt_answers question_reports announcements
  news_posts news_likes news_comments
  conversations chat_messages chat_cleanup_logs
  active_sessions system_settings
)

i=0
for t in "${TABLES[@]}"; do
  i=$((i+1))
  n=$(printf '%02d' $i)
  f="$DIR/${n}_${t}.sql"

  exists=$("${PSQL[@]}" -At -c "select to_regclass('public.$t') is not null")
  if [ "$exists" != "t" ]; then
    echo "  $n $t: khong ton tai -> bo qua"
    continue
  fi

  cols=$("${PSQL[@]}" -At -c "select string_agg(quote_ident(column_name), ', ' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='$t'")
  vals=$("${PSQL[@]}" -At -c "select string_agg('quote_nullable(' || quote_ident(column_name) || ')', ' || '', '' || ' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='$t'")
  cnt=$("${PSQL[@]}" -At -c "select count(*) from public.$t")

  {
    echo "-- Bang: $t ($cnt dong) - xuat luc $(date -u '+%Y-%m-%d %H:%M UTC')"
    echo "BEGIN;"
    echo "SET session_replication_role = replica;"
  } > "$f"
  if [ "$cnt" != "0" ]; then
    "${PSQL[@]}" -At -c "select 'INSERT INTO public.$t ($cols) VALUES (' || $vals || ') ON CONFLICT DO NOTHING;' from public.$t" >> "$f"
  fi
  {
    echo "SET session_replication_role = origin;"
    echo "COMMIT;"
  } >> "$f"
  echo "  $n $t: $cnt dong -> $(du -h "$f" | cut -f1)"
done

echo "Xong. Thu muc: $DIR"
echo "Nho lay them anh/tep trong Storage bang chuc nang 'Sao luu toan bo + media' o trang Quan tri -> Sao luu."
