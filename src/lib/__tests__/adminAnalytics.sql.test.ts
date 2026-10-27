// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Real PostgreSQL, not a JavaScript reimplementation of the financial formulas.
const db = new PGlite();
const admin = '00000000-0000-0000-0000-000000000001';
const user = '00000000-0000-0000-0000-000000000002';
const a = '10000000-0000-0000-0000-000000000001';
const b = '10000000-0000-0000-0000-000000000002';
const c = '10000000-0000-0000-0000-000000000003';
async function json<T>(sql: string, args: unknown[] = []) {
  return (await db.query<{ value: T }>(`SELECT ${sql} AS value`, args)).rows[0].value;
}
type Summary = { revenue: number; approved: number; pendingOrders: number; orders: number };
type Sales = { rows: { id: string; count: number; revenue: number }[]; total: number; unallocated: number };
type Series = { label: string; start: string; revenue: number }[];

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      'SELECT nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
    CREATE TYPE public.app_role AS ENUM ('user','admin');
    CREATE TABLE profiles(id uuid PRIMARY KEY);
    CREATE TABLE user_roles(user_id uuid, role app_role);
    CREATE FUNCTION public.has_role(_user_id uuid, _role app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS
      'SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)';
    CREATE TABLE subjects(id uuid PRIMARY KEY, name text, semester integer);
    CREATE TABLE orders(id text PRIMARY KEY, status text, final_amount numeric(12,0), created_at timestamptz, user_id uuid);
    CREATE TABLE order_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id text, subject_id uuid, price numeric(12,0));
    CREATE TABLE exams(id uuid PRIMARY KEY, title text);
    CREATE TABLE questions(id uuid PRIMARY KEY, exam_id uuid);
    CREATE TABLE question_options(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_id uuid, label text, is_correct boolean);
    CREATE TABLE exam_subjects(exam_id uuid, subject_id uuid, PRIMARY KEY(exam_id,subject_id));
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    GRANT SELECT ON orders,order_items,questions TO authenticated;
    CREATE POLICY users_view_own_orders ON orders FOR SELECT USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
    CREATE POLICY admins_manage_order_items ON order_items FOR ALL USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
    CREATE POLICY users_view_own_order_items ON order_items FOR SELECT USING(EXISTS(SELECT 1 FROM orders WHERE orders.id=order_items.order_id AND orders.user_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
    CREATE POLICY admins_manage_questions ON questions FOR ALL USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
    CREATE FUNCTION public.can_access_exam(_exam_id uuid) RETURNS boolean LANGUAGE sql STABLE AS 'SELECT _exam_id = ''${c}''::uuid';
    CREATE POLICY users_view_questions_of_accessible_exams ON questions FOR SELECT USING(public.can_access_exam(exam_id));
    INSERT INTO profiles VALUES ('${admin}'),('${user}');
    INSERT INTO user_roles VALUES ('${admin}','admin'),('${user}','user');
  `);
  await db.exec(readFileSync(new URL('../../../supabase/migrations/20261026170000_admin_analytics.sql', import.meta.url), 'utf8'));
}, 60_000);
beforeEach(async () => {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${admin}',false);
    TRUNCATE orders,order_items,subjects,exams,questions,question_options,exam_subjects;
    INSERT INTO subjects VALUES ('${a}','Same name',1),('${b}','Same name',1),('${c}','Third',2);`);
});
afterAll(async () => { await db.close(); });

describe('admin analytics database contracts', () => {
  it('reconciles more than 50,000 mixed orders including older history against an independent SQL sum', async () => {
    await db.exec(`INSERT INTO orders(id,status,final_amount,created_at) SELECT 'scale-' || n, CASE WHEN n % 5 = 0 THEN 'pending' ELSE 'approved' END,
      100000, now() - (n % 900) * interval '1 day' FROM generate_series(1,50050) n;
      INSERT INTO orders(id,status,final_amount,created_at) VALUES ('rejected','rejected',999999,now()),('old','approved',200000,'2020-01-01');`);
    const summary = await json<Summary>('admin_commerce_summary()');
    const independent = (await db.query<{ revenue: string; approved: number }>(
      "SELECT sum(final_amount)::text revenue, count(*)::int approved FROM orders WHERE status='approved'",
    )).rows[0];
    expect(summary.revenue).toBe(Number(independent.revenue));
    expect(summary.approved).toBe(independent.approved);
    expect(summary.orders).toBe(50052);
    expect(summary.pendingOrders).toBe(10010);
    expect(JSON.stringify(summary).length).toBeLessThan(500);
  }, 30_000);

  it('distinguishes a successful empty summary from a failed or unauthorized call', async () => {
    expect((await json<Summary>('admin_commerce_summary()')).revenue).toBe(0);
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${user}',false); SET ROLE authenticated;`);
    for (const fn of ["admin_commerce_summary()", "admin_revenue_series('day')", "admin_subject_sales()", 'admin_exam_statistics()']) {
      await expect(json(fn)).rejects.toMatchObject({ code: '42501' });
    }
    await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false); SET ROLE authenticated;`);
    await expect(json('admin_commerce_summary()')).rejects.toMatchObject({ code: '42501' });
    await db.exec('RESET ROLE; SET ROLE anon;');
    await expect(json('admin_commerce_summary()')).rejects.toMatchObject({ code: '42501' });
    await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${admin}',false); SET ROLE authenticated;`);
    expect((await json<Summary>('admin_commerce_summary()')).orders).toBe(0);
  });

  it('preserves own-order and item isolation after RLS optimization', async () => {
    await db.exec(`INSERT INTO orders(id,status,final_amount,created_at,user_id) VALUES
      ('own','approved',10,now(),'${user}'),('other','approved',20,now(),'${admin}');
      INSERT INTO order_items(order_id,subject_id,price) VALUES ('own','${a}',10),('other','${a}',20);
      INSERT INTO questions VALUES ('${a}','${a}'),('${b}','${c}');
      SELECT set_config('request.jwt.claim.sub','${user}',false); SET ROLE authenticated;`);
    expect((await db.query('SELECT id FROM orders')).rows).toEqual([{id:'own'}]);
    expect((await db.query('SELECT order_id FROM order_items')).rows).toEqual([{order_id:'own'}]);
    expect((await db.query('SELECT id FROM questions')).rows).toEqual([{id:b}]);
    await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${admin}',false); SET ROLE authenticated;`);
    expect((await db.query('SELECT id FROM orders')).rows).toHaveLength(2);
    expect((await db.query('SELECT order_id FROM order_items')).rows).toHaveLength(2);
    expect((await db.query('SELECT id FROM questions')).rows).toHaveLength(2);
  });

  it('keeps months in their own year and includes every Vietnam day/week boundary exactly once', async () => {
    await db.exec(`INSERT INTO orders(id,status,final_amount,created_at) VALUES
      ('current','approved',100, date_trunc('month',now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      ('previous-year','approved',200,(date_trunc('month',now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - interval '1 year') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      ('hour-ago','approved',7,now()-interval '1 hour'),
      ('monday','approved',11,date_trunc('week',now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      ('sunday-last-second','approved',13,(date_trunc('week',now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh')-interval '1 microsecond');`);
    const year = await json<number>("extract(year FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int");
    const months = await json<Series>('admin_revenue_series($1,$2)', ['month', year]);
    const direct = await json<number>("(SELECT sum(final_amount) FROM orders WHERE extract(year FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1)", [year]);
    expect(months).toHaveLength(12);
    expect(months.reduce((s,x)=>s+x.revenue,0)).toBe(Number(direct));
    for (const period of ['week','day']) {
      const series = await json<Series>('admin_revenue_series($1)', [period]);
      const start = series[0].start;
      const expected = await json<number>("(SELECT coalesce(sum(final_amount),0) FROM orders WHERE status='approved' AND created_at >= $1::timestamptz)", [start]);
      expect(series).toHaveLength(period === 'week' ? 8 : 14);
      expect(series.reduce((s,x)=>s+x.revenue,0)).toBe(Number(expected));
    }
    // SQL/server session and browser locale must not change Vietnam buckets.
    const before = await json<Series>("admin_revenue_series('day')");
    await db.exec("SET TIME ZONE 'America/Los_Angeles'");
    expect((await json<Series>("admin_revenue_series('day')")).map(x=>x.revenue)).toEqual(before.map(x=>x.revenue));
    const years = await json<Series>("admin_revenue_series('year')");
    expect(years.reduce((s,x)=>s+x.revenue,0)).toBe(331);
  });

  it('allocates discounts with exact VND rounding, separates duplicate names, and exposes missing item detail', async () => {
    await db.exec(`INSERT INTO orders(id,status,final_amount,created_at) VALUES ('discount','approved',101,now()),('missing','approved',17,now()),('zero','approved',2,now());
      INSERT INTO order_items VALUES
      ('${a}','discount','${a}',100),('${b}','discount','${b}',100),('${c}','discount','${c}',100),
      (gen_random_uuid(),'zero','${a}',0);`);
    const sales = await json<Sales>('admin_subject_sales()');
    expect(sales.rows).toHaveLength(3);
    expect(sales.rows.map(x=>x.revenue).sort((x,y)=>x-y)).toEqual([33,34,34]);
    expect(sales.unallocated).toBe(19);
    expect(sales.rows.reduce((s,x)=>s+x.revenue,0)+sales.unallocated).toBe(sales.total);
    const top = await json<Sales>("admin_subject_sales('week',2)");
    expect(top.rows).toHaveLength(2);
    expect(top.total).toBe(120); // The period total is independent of top-N.
  });

  it('counts shared exams once globally and retains empty unlinked exams', async () => {
    await db.exec(`INSERT INTO exams VALUES ('${a}','Shared'),('${b}','Empty');
      INSERT INTO exam_subjects VALUES ('${a}','${a}'),('${a}','${b}');
      INSERT INTO questions VALUES ('${a}','${a}'),('${b}','${a}');
      INSERT INTO question_options(question_id,label,is_correct) VALUES ('${a}','a',true),('${a}','b',true);`);
    const statistics = await json<{ groups: unknown[]; exams: { totalQ: number; noAnswer: number; counts: Record<string, number> }[] }>('admin_exam_statistics()');
    expect(statistics.groups).toHaveLength(3);
    expect(statistics.exams).toHaveLength(2);
    expect(statistics.exams.reduce((s,x)=>s+x.totalQ,0)).toBe(2);
    expect(statistics.exams[0]).toMatchObject({ totalQ: 2, noAnswer: 1, counts: { A: 1, B: 1 } });
  });

  it('aggregates 10,000 questions without a correlated full scan for every question', async () => {
    await db.exec(`INSERT INTO exams VALUES ('${a}','Large exam');
      INSERT INTO questions SELECT gen_random_uuid(),'${a}' FROM generate_series(1,10000);
      INSERT INTO question_options(question_id,label,is_correct) SELECT q.id,chr(64+n),n=1 FROM questions q CROSS JOIN generate_series(1,4) n;
      SET statement_timeout='5s';`);
    const statistics = await json<{exams:{totalQ:number;noAnswer:number;counts:Record<string,number>}[]}>('admin_exam_statistics()');
    expect(statistics.exams[0]).toMatchObject({totalQ:10000,noAnswer:0,counts:{A:10000}});
    await db.exec('RESET statement_timeout');
  }, 20_000);
});
