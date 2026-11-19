/**
 * All Kecamatan on Pulau Jawa (DKI, Jabar, Jateng, DIY, Jatim, Banten).
 * Dataset: src/data/java-kecamatan.json (2.143 entries).
 */

let cache = null;
let loading = null;

export async function loadJavaKecamatan() {
  if (cache) return cache;
  if (loading) return loading;

  loading = fetch(new URL('./java-kecamatan.json', import.meta.url))
    .then((response) => {
      if (!response.ok) throw new Error('Failed to load Java Kecamatan data');
      return response.json();
    })
    .then((rows) => {
      cache = Array.isArray(rows) ? rows : [];
      return cache;
    })
    .finally(() => {
      loading = null;
    });

  return loading;
}

/**
 * Search Kecamatan across Java. Empty query returns a short starter list.
 */
export async function searchJavaKecamatan(query = '', limit = 40) {
  const rows = await loadJavaKecamatan();
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return rows.slice(0, limit).map(asResult);
  }

  const scored = [];
  for (const row of rows) {
    const hay = `${row.name} ${row.regency} ${row.province} ${row.label}`.toLowerCase();
    if (!hay.includes(needle)) continue;
    const starts =
      row.name.toLowerCase().startsWith(needle) ||
      row.label.toLowerCase().startsWith(needle)
        ? 0
        : 1;
    scored.push({ starts, row });
  }

  scored.sort((a, b) => a.starts - b.starts || a.row.label.localeCompare(b.row.label));
  return scored.slice(0, limit).map((item) => asResult(item.row));
}

function asResult(row) {
  return {
    key: `java-${row.id}`,
    label: row.label,
    detail: row.province,
    id: row.id,
    name: row.name,
    regency: row.regency,
    province: row.province,
  };
}

export async function javaKecamatanCount() {
  const rows = await loadJavaKecamatan();
  return rows.length;
}
