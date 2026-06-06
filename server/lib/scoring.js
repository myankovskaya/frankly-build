const { groupByMonth, monthKey } = require('./anomalies');

function calculateScores(transactions, anomalies) {
  // Revenue score
  const revPenalties = [];
  const revTransactions = transactions.filter((t) => t.type === 'revenue');
  const expTransactions = transactions.filter((t) => t.type === 'expense');

  // Duplicate revenue entries
  const dupRevCount = anomalies.filter((a) => a.type === 'duplicate').length;
  // Split dups roughly evenly between rev and exp for now; refine by checking transaction type
  const revDups = countDuplicates(revTransactions);
  const expDups = countDuplicates(expTransactions);

  if (revDups > 0) {
    revPenalties.push({ label: `${revDups} duplicate revenue transaction${revDups > 1 ? 's' : ''} detected`, penalty: revDups * 8 });
  }

  // Revenue gaps > 14 days
  const revGaps = countGaps(revTransactions, 14);
  if (revGaps > 0) {
    revPenalties.push({ label: `${revGaps} gap${revGaps > 1 ? 's' : ''} longer than 14 days with no revenue`, penalty: revGaps * 6 });
  }

  // Single revenue source > 70% of total
  const revByCategory = {};
  for (const t of revTransactions) {
    if (t.category) revByCategory[t.category] = (revByCategory[t.category] || 0) + t.amount;
  }
  const totalRev = Object.values(revByCategory).reduce((s, v) => s + v, 0);
  const maxRevSource = Math.max(...Object.values(revByCategory), 0);
  if (totalRev > 0 && maxRevSource / totalRev > 0.7) {
    const pct = Math.round((maxRevSource / totalRev) * 100);
    const cat = Object.keys(revByCategory).find((k) => revByCategory[k] === maxRevSource);
    revPenalties.push({ label: `${cat} = ${pct}% of total revenue (concentration risk)`, penalty: 5 });
  }

  // Months with zero revenue
  const allMonths = getMonthRange(transactions);
  const revByMonth = groupByMonth(revTransactions.map((t) => ({ ...t, category: t.category || '_' })));
  let zeroRevMonths = 0;
  for (const m of allMonths) {
    const monthTotal = Object.values(revByMonth[m] || {}).reduce((s, v) => s + v, 0);
    if (monthTotal === 0) zeroRevMonths++;
  }
  if (zeroRevMonths > 0) {
    revPenalties.push({ label: `${zeroRevMonths} month${zeroRevMonths > 1 ? 's' : ''} with zero revenue`, penalty: zeroRevMonths * 10 });
  }

  // Cash flow score
  const cfPenalties = [];
  const netByMonth = allMonths.map((m) => {
    const rev = Object.values(revByMonth[m] || {}).reduce((s, v) => s + v, 0);
    const expByM = groupByMonth(expTransactions.map((t) => ({ ...t, category: t.category || '_' })));
    const exp = Object.values(expByM[m] || {}).reduce((s, v) => s + v, 0);
    return rev - exp;
  });

  // 3+ consecutive months negative
  let consNeg = 0, maxConsNeg = 0;
  for (const n of netByMonth) {
    if (n < 0) { consNeg++; maxConsNeg = Math.max(maxConsNeg, consNeg); }
    else consNeg = 0;
  }
  if (maxConsNeg >= 3) {
    cfPenalties.push({ label: `${maxConsNeg} consecutive months of negative net cash flow`, penalty: 15 });
  }

  // High variance
  if (netByMonth.length > 1) {
    const mean = netByMonth.reduce((s, v) => s + v, 0) / netByMonth.length;
    const variance = netByMonth.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / netByMonth.length;
    const stddev = Math.sqrt(variance);
    if (mean !== 0 && stddev / Math.abs(mean) > 0.4) {
      cfPenalties.push({ label: `High cash flow variance (stddev ${Math.round((stddev / Math.abs(mean)) * 100)}% of mean)`, penalty: 10 });
    }
  }

  // Missing transaction dates
  const missingDates = transactions.filter((t) => !t.date).length;
  if (missingDates > 0) {
    cfPenalties.push({ label: `${missingDates} transaction${missingDates > 1 ? 's' : ''} missing dates`, penalty: missingDates * 5 });
  }

  // Expense score
  const expPenalties = [];

  // Uncategorized expenses
  const uncatExp = expTransactions.filter((t) => !t.category).length;
  if (uncatExp > 0) {
    expPenalties.push({ label: `${uncatExp} uncategorized expense transaction${uncatExp > 1 ? 's' : ''}`, penalty: uncatExp * 4 });
  }

  // Duplicate expenses
  if (expDups > 0) {
    expPenalties.push({ label: `${expDups} duplicate expense entr${expDups > 1 ? 'ies' : 'y'} detected`, penalty: expDups * 8 });
  }

  // Expense spikes
  const spikeAnomalies = anomalies.filter((a) => a.type === 'spike');
  if (spikeAnomalies.length > 0) {
    expPenalties.push({ label: `${spikeAnomalies.length} expense spike${spikeAnomalies.length > 1 ? 's' : ''} >30% MoM`, penalty: spikeAnomalies.length * 6 });
  }

  // Expense gaps
  const expGaps = countGaps(expTransactions, 14);
  if (expGaps > 0) {
    expPenalties.push({ label: `${expGaps} gap${expGaps > 1 ? 's' : ''} longer than 14 days with no expenses`, penalty: expGaps * 5 });
  }

  const revenueScore = Math.max(0, 100 - revPenalties.reduce((s, p) => s + p.penalty, 0));
  const cashFlowScore = Math.max(0, 100 - cfPenalties.reduce((s, p) => s + p.penalty, 0));
  const expensesScore = Math.max(0, 100 - expPenalties.reduce((s, p) => s + p.penalty, 0));
  const overall = Math.round((revenueScore + cashFlowScore + expensesScore) / 3);

  return {
    overall,
    revenue: { score: revenueScore, penalties: revPenalties },
    cashFlow: { score: cashFlowScore, penalties: cfPenalties },
    expenses: { score: expensesScore, penalties: expPenalties },
  };
}

function countDuplicates(transactions) {
  let count = 0;
  const seen = new Set();
  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i];
      const b = transactions[j];
      if (
        a.date && b.date &&
        a.amount === b.amount &&
        a.category === b.category &&
        Math.abs(a.date - b.date) <= 48 * 60 * 60 * 1000
      ) {
        if (!seen.has(j)) { seen.add(j); count++; }
      }
    }
  }
  return count;
}

function countGaps(transactions, days) {
  const sorted = transactions.filter((t) => t.date).sort((a, b) => a.date - b.date);
  let count = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = (sorted[i + 1].date - sorted[i].date) / (1000 * 60 * 60 * 24);
    if (gap > days) count++;
  }
  return count;
}

function getMonthRange(transactions) {
  const dates = transactions.filter((t) => t.date).map((t) => t.date);
  if (dates.length === 0) return [];
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  const months = [];
  const d = new Date(min.getFullYear(), min.getMonth(), 1);
  while (d <= max) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

module.exports = { calculateScores, getMonthRange };
