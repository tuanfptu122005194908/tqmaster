type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/** Read a table in primary-key order. A short page can be an API row cap. */
export async function fetchAllById<T extends { id: string }>(
  loadPage: (afterId: string | null) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  let afterId: string | null = null;
  for (;;) {
    const { data, error } = await loadPage(afterId);
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Không nhận được dữ liệu từ máy chủ.');
    if (data.length === 0) return rows;

    for (const row of data) {
      if (!row.id || (afterId !== null && row.id <= afterId)) {
        throw new Error('Dữ liệu phân trang không theo thứ tự. Vui lòng tải lại.');
      }
      afterId = row.id;
      rows.push(row);
    }
  }
}
