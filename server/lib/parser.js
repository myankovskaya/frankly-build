const Papa = require('papaparse');

function parseCSV(csvString) {
  const result = Papa.parse(csvString.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
    transform: (v) => v.trim(),
  });

  return result.data
    .map((row) => {
      const amount = parseFloat(row.amount);
      const category = row.category || null;
      const dateStr = row.date || null;
      const type = (row.type || '').toLowerCase();

      let parsedDate = null;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) parsedDate = d;
      }

      return {
        date: parsedDate,
        dateStr: dateStr,
        type,
        category: category && category.length > 0 ? category : null,
        amount: isNaN(amount) ? 0 : Math.abs(amount),
        raw: row,
      };
    })
    .filter((t) => t.amount > 0 && (t.type === 'revenue' || t.type === 'expense'));
}

module.exports = { parseCSV };
