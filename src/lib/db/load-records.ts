export async function loadRecords<T>(load: () => Promise<T>) {
  try {
    const data = await load();

    return { ok: true as const, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load records.";

    return { ok: false as const, message };
  }
}
