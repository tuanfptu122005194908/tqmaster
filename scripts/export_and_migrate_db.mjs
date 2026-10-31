import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = path.resolve('backup_sql');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync('scratch', { recursive: true });

const NEW_DB_URL = process.env.VITE_SUPABASE_URL || 'https://dkujrthjkefusiciyckd.supabase.co';
const NEW_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

function queryOldDb(sql) {
  const tmpFile = path.resolve('scratch/tmp_query.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  const out = execSync(`npx supabase db query --linked --file "${tmpFile}" --output json`, {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  const jsonStart = out.indexOf('{\n  "boundary"');
  const cleanJson = jsonStart >= 0 ? out.slice(jsonStart) : out;
  const parsed = JSON.parse(cleanJson);
  return parsed.rows || [];
}

async function execNewDb(sql) {
  const res = await fetch(`${NEW_DB_URL}/rest/v1/rpc/_admin_exec`, {
    method: 'POST',
    headers: {
      apikey: NEW_SECRET_KEY,
      Authorization: `Bearer ${NEW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql_text: sql }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`New DB exec error (${res.status}): ${errText}`);
  }
}

function sqlLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (Array.isArray(val)) {
    const elems = val.map(x => `'${String(x ?? '').replace(/'/g, "''")}'`).join(', ');
    return `ARRAY[${elems}]::text[]`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

let colTypesMap = new Map();
let publicColumnsList = [];

async function loadAndSyncColumnTypes() {
  console.log('🔍 Đang đọc cấu trúc kiểu dữ liệu cột từ DB cũ và đồng bộ sang DB mới...');
  const rows = queryOldDb(`
    SELECT table_schema, table_name, column_name, data_type, udt_name, column_default
    FROM information_schema.columns
    WHERE table_schema IN ('public', 'auth')
    ORDER BY table_schema, table_name, ordinal_position
  `);
  for (const r of rows) {
    colTypesMap.set(`${r.table_schema}.${r.table_name}.${r.column_name}`, r);
    if (r.table_schema === 'public') {
      publicColumnsList.push(r);
    }
  }

  // Generate ADD COLUMN IF NOT EXISTS for all public tables on new DB so no column is ever missing
  const alterStmts = [];
  for (const r of publicColumnsList) {
    let pgType = r.data_type;
    if (r.data_type === 'ARRAY') {
      pgType = `${r.udt_name.replace(/^_/, '')}[]`;
    } else if (r.data_type === 'USER-DEFINED') {
      pgType = `public.${r.udt_name}`;
    }
    alterStmts.push(`ALTER TABLE IF EXISTS public."${r.table_name}" ADD COLUMN IF NOT EXISTS "${r.column_name}" ${pgType};`);
  }
  await execNewDb(alterStmts.join('\n') + `\nNOTIFY pgrst, 'reload schema';`);
  console.log(`✅ Đã đồng bộ đầy đủ ${publicColumnsList.length} cột bảng public sang DB mới.`);
}

function formatCellValue(schema, table, col, val) {
  if (val === null || val === undefined) return 'NULL';
  const meta = colTypesMap.get(`${schema}.${table}.${col}`);
  if (meta) {
    if (meta.data_type === 'ARRAY') {
      if (!Array.isArray(val) || val.length === 0) return `'{}'::${meta.udt_name.replace(/^_/, '')}[]`;
      const baseType = meta.udt_name.replace(/^_/, '');
      const elems = val.map(x => `'${String(x ?? '').replace(/'/g, "''")}'`).join(', ');
      return `ARRAY[${elems}]::${baseType}[]`;
    }
    if (meta.data_type === 'jsonb' || meta.data_type === 'json') {
      return `'${JSON.stringify(val).replace(/'/g, "''")}'::${meta.data_type}`;
    }
  }
  return sqlLiteral(val);
}

function buildInsertStatements(schema, table, rows, conflictTarget, chunkSize = 500) {
  if (!rows || rows.length === 0) return [];
  const generatedCols = new Set();
  if (schema === 'auth' && table === 'users') {
    generatedCols.add('confirmed_at');
  }
  if (schema === 'auth' && table === 'identities') {
    generatedCols.add('email');
  }

  const cols = Object.keys(rows[0]).filter(c => !generatedCols.has(c));
  const colList = cols.map(c => `"${c}"`).join(', ');
  const statements = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const valuesList = slice
      .map(row => {
        const vals = cols.map(c => formatCellValue(schema, table, c, row[c]));
        return `(${vals.join(', ')})`;
      })
      .join(',\n');

    const conflictClause = conflictTarget
      ? `ON CONFLICT (${conflictTarget}) DO NOTHING`
      : `ON CONFLICT DO NOTHING`;

    statements.push(`INSERT INTO ${schema}."${table}" (${colList})\nVALUES\n${valuesList}\n${conflictClause};`);
  }

  return statements;
}

const TABLES_TO_MIGRATE = [
  // Already migrated in run 1: auth.users, auth.identities, profiles, user_roles, subjects
  { schema: 'public', name: 'exams', conflict: 'id', orderCol: 'id', file: '04_exams.sql', batchFetch: 1000 },
  { schema: 'public', name: 'exam_subjects', conflict: 'exam_id,subject_id', orderCol: 'exam_id,subject_id', file: '05_exam_subjects.sql', batchFetch: 2000 },
  { schema: 'public', name: 'questions', conflict: 'id', orderCol: 'id', file: '06_questions.sql', batchFetch: 8000 },
  { schema: 'public', name: 'question_options', conflict: 'id', orderCol: 'id', file: '07_question_options.sql', batchFetch: 25000 },
  { schema: 'public', name: 'theories', conflict: 'id', orderCol: 'id', file: '08_theories.sql', batchFetch: 1000 },
  { schema: 'public', name: 'theory_subjects', conflict: 'theory_id,subject_id', orderCol: 'theory_id,subject_id', file: '09_theory_subjects.sql', batchFetch: 2000 },
  { schema: 'public', name: 'user_subjects', conflict: 'id', orderCol: 'id', file: '10_user_subjects.sql', batchFetch: 2000 },
  { schema: 'public', name: 'discount_codes', conflict: 'id', orderCol: 'id', file: '11_discount_codes.sql', batchFetch: 1000 },
  { schema: 'public', name: 'orders', conflict: 'id', orderCol: 'id', file: '12_orders.sql', batchFetch: 2000 },
  { schema: 'public', name: 'order_items', conflict: 'id', orderCol: 'id', file: '13_order_items.sql', batchFetch: 2000 },
  { schema: 'public', name: 'exam_attempts', conflict: 'id', orderCol: 'id', file: '14_exam_attempts.sql', batchFetch: 7000 },
  { schema: 'public', name: 'question_reports', conflict: 'id', orderCol: 'id', file: '16_question_reports.sql', batchFetch: 1000 },
  { schema: 'public', name: 'announcements', conflict: 'id', orderCol: 'id', file: '17_announcements.sql', batchFetch: 1000 },
  { schema: 'public', name: 'news_posts', conflict: 'id', orderCol: 'id', file: '18_news_posts.sql', batchFetch: 1000 },
  { schema: 'public', name: 'news_likes', conflict: 'post_id,user_id', orderCol: 'post_id,user_id', file: '19_news_likes.sql', batchFetch: 1000 },
  { schema: 'public', name: 'news_comments', conflict: 'id', orderCol: 'id', file: '20_news_comments.sql', batchFetch: 1000 },
  { schema: 'public', name: 'conversations', conflict: 'id', orderCol: 'id', file: '21_conversations.sql', batchFetch: 1000 },
  { schema: 'public', name: 'system_settings', conflict: 'key', orderCol: 'key', file: '24_system_settings.sql', batchFetch: 1000 },
];

async function main() {
  await loadAndSyncColumnTypes();

  for (const tbl of TABLES_TO_MIGRATE) {
    const fullName = `${tbl.schema}.${tbl.name}`;
    const countRows = queryOldDb(`SELECT count(*)::int AS cnt FROM ${fullName};`);
    const total = countRows[0]?.cnt ?? 0;

    if (total === 0) {
      console.log(`⏭️ [${fullName}] 0 dòng, bỏ qua.`);
      continue;
    }

    console.log(`\n📦 Đang xuất & nạp [${fullName}] (${total.toLocaleString()} dòng)...`);
    const sqlFilePath = path.join(OUT_DIR, tbl.file);
    fs.writeFileSync(
      sqlFilePath,
      `-- Backup of ${fullName} (${total} rows)\nSET session_replication_role = replica;\n\n`,
      'utf8'
    );

    let offset = 0;
    let lastId = null;
    const isSingleId = tbl.orderCol === 'id';

    while (offset < total) {
      const whereClause = isSingleId && lastId ? `WHERE id > '${lastId}'` : '';
      const offsetClause = !isSingleId ? `OFFSET ${offset}` : '';
      const fetchSql = `
        SELECT COALESCE(json_agg(t), '[]'::json) AS data
        FROM (
          SELECT * FROM ${fullName}
          ${whereClause}
          ORDER BY ${tbl.orderCol} ASC
          LIMIT ${tbl.batchFetch}
          ${offsetClause}
        ) t;
      `;
      const resRows = queryOldDb(fetchSql);
      const batch = resRows[0]?.data || [];
      if (batch.length === 0) break;

      if (isSingleId) {
        lastId = batch[batch.length - 1].id;
      }
      offset += batch.length;

      const statements = buildInsertStatements(tbl.schema, tbl.name, batch, tbl.conflict, 500);
      fs.appendFileSync(sqlFilePath, statements.join('\n\n') + '\n\n', 'utf8');

      for (let i = 0; i < statements.length; i += 3) {
        const chunkSql = `SET session_replication_role = replica;\n` + statements.slice(i, i + 3).join('\n');
        await execNewDb(chunkSql);
      }

      console.log(`   ✅ Đã xuất & nạp ${offset.toLocaleString()} / ${total.toLocaleString()} dòng`);
    }

    fs.appendFileSync(sqlFilePath, `SET session_replication_role = origin;\n`, 'utf8');
  }

  console.log('\n🎉 HOÀN TẤT XUẤT FILE SQL VÀ NẠP DỮ LIỆU CHÍNH SANG DB MỚI!');
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
