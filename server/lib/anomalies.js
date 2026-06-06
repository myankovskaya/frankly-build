function detectAnomalies(transactions) {
  const anomalies = [];

  // Duplicates: same type + category + amount within 48 hours
  const duplicateIds = new Set();
  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i];
      const b = transactions[j];
      if (
        a.date &&
        b.date &&
        a.type === b.type &&
        a.category === b.category &&
        a.amount === b.amount &&
        Math.abs(a.date - b.date) <= 48 * 60 * 60 * 1000
      ) {
        if (!duplicateIds.has(j)) {
          duplicateIds.add(j);
          anomalies.push({
            type: 'duplicate',
            severity: 'high',
            description: `Possible duplicate ${a.type}: ${a.category || 'uncategorized'} for $${a.amount.toLocaleString()} appears twice within 48 hours`,
            amount: a.amount,
            date: a.date ? a.date.toISOString().slice(0, 10) : a.dateStr,
            suggestedFix: 'Verify whether this transaction occurred once or twice. Delete the duplicate if confirmed.',
          });
        }
      }
    }
  }

  // Gaps: more than 14 days with no transactions
  const sorted = transactions.filter((t) => t.date).sort((a, b) => a.date - b.date);
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapDays = (sorted[i + 1].date - sorted[i].date) / (1000 * 60 * 60 * 24);
    if (gapDays > 14) {
      const startDate = sorted[i].date.toISOString().slice(0, 10);
      const endDate = sorted[i + 1].date.toISOString().slice(0, 10);
      anomalies.push({
        type: 'gap',
        severity: 'medium',
        description: `No transactions recorded for ${Math.round(gapDays)} days (${startDate} to ${endDate})`,
        amount: 0,
        date: startDate,
        suggestedFix: 'Check if transactions from this period are missing from your export. Re-export from your accounting tool covering this date range.',
      });
    }
  }

  // Spikes: any expense category with >30% increase vs prior month
  const byMonth = groupByMonth(transactions.filter((t) => t.type === 'expense' && t.category));
  const months = Object.keys(byMonth).sort();
  for (let i = 1; i < months.length; i++) {
    const prev = byMonth[months[i - 1]];
    const curr = byMonth[months[i]];
    const categories = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    for (const cat of categories) {
      const prevAmt = prev[cat] || 0;
      const currAmt = curr[cat] || 0;
      if (prevAmt > 0 && currAmt > prevAmt * 1.3) {
        const pct = Math.round(((currAmt - prevAmt) / prevAmt) * 100);
        anomalies.push({
          type: 'spike',
          severity: pct > 60 ? 'high' : 'medium',
          description: `${cat} expenses rose ${pct}% in ${months[i]} vs ${months[i - 1]} ($${prevAmt.toLocaleString()} → $${currAmt.toLocaleString()})`,
          amount: currAmt - prevAmt,
          date: months[i],
          suggestedFix: `Review ${cat} spending for ${months[i]}. If this was a one-time purchase, flag it as non-recurring to exclude from trend analysis.`,
        });
      }
    }
  }

  // Uncategorized: null or empty category
  transactions
    .filter((t) => !t.category)
    .forEach((t) => {
      anomalies.push({
        type: 'uncategorized',
        severity: 'low',
        description: `Uncategorized ${t.type} of $${t.amount.toLocaleString()} on ${t.date ? t.date.toISOString().slice(0, 10) : t.dateStr}`,
        amount: t.amount,
        date: t.date ? t.date.toISOString().slice(0, 10) : t.dateStr,
        suggestedFix: 'Assign a category to this transaction in your accounting tool, then re-export and upload.',
      });
    });

  // Sort: high first, then medium, then low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return anomalies;
}

function groupByMonth(transactions) {
  const result = {};
  for (const t of transactions) {
    if (!t.date) continue;
    const key = monthKey(t.date);
    if (!result[key]) result[key] = {};
    result[key][t.category] = (result[key][t.category] || 0) + t.amount;
  }
  return result;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = { detectAnomalies, groupByMonth, monthKey };
