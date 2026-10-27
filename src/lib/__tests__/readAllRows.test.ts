import { describe, expect, it } from 'vitest';
import { cursorFilter, readAllRows } from '../../../supabase/functions/_shared/readAllRows';

describe('complete bulk reads', () => {
  it.each([100,500,1000])('continues past short pages with server cap %i', async cap => {
    const source = Array.from({ length: 1601 }, (_, id) => ({ id }));
    expect(await readAllRows(['id'], async (cursor,size) => ({
      data: source.filter(r=>!cursor || r.id > Number(cursor.id)).slice(0,Math.min(cap,size)), error: null,
    }))).toEqual(source);
  });
  it('uses both columns at a composite-key boundary and escapes text values', () => {
    expect(cursorFilter(['exam_id','subject_id'],{exam_id:'same',subject_id:'last'})).toBe('exam_id.gt."same",and(exam_id.eq."same",subject_id.gt."last")');
    expect(cursorFilter(['key'],{key:'a,"b\\c'})).toBe('key.gt."a,\\"b\\\\c"');
  });
  it('rejects partial success, missing keys and repeated cursors', async () => {
    await expect(readAllRows(['id'], async cursor=>cursor ? {data:null,error:{message:'denied'}} : {data:[{id:'x'}],error:null})).rejects.toThrow('denied');
    await expect(readAllRows(['id'], async ()=>({data:[{}],error:null}))).rejects.toThrow('cursor key');
    await expect(readAllRows(['id'], async ()=>({data:[{id:'x'}],error:null}))).rejects.toThrow('phân trang');
  });
});
