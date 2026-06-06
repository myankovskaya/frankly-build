const { groupByMonth } = require('./anomalies');
const { getMonthRange } = require('./scoring');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildTimeline(transactions) {
  const revenues = transactions.filter((t) => t.type === 'revenue');
  const expenses = transactions.filter((t) => t.type === 'expense');

  const allMonths = getMonthRange(transactions);

  const revByMonth = groupByMonth(revenues.map((t) => ({ ...t, category: t.category || '_rev' })));
  const expByMonth = groupByMonth(expenses.map((t) => ({ ...t, category: t.category || '_exp' })));

  let cumulative = 0;
  const timeline = allMonths.map((mk) => {
    const [year, month] = mk.split('-').map(Number);
    const label = `${MONTH_LABELS[month - 1]} ${year}`;

    const income = Object.values(revByMonth[mk] || {}).reduce((s, v) => s + v, 0);
    const expTotal = Object.values(expByMonth[mk] || {}).reduce((s, v) => s + v, 0);
    const netCash = income - expTotal;
    cumulative += netCash;

    return { month: label, monthKey: mk, income, expenses: expTotal, netCash, cumulativeCash: cumulative };
  });

  return timeline;
}

function buildForecast(timeline, cashOnHand) {
  if (timeline.length === 0) return [];

  const nets = timeline.map((m) => m.netCash);
  const mean = nets.reduce((s, v) => s + v, 0) / nets.length;
  const variance = nets.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / nets.length;
  const stddev = Math.sqrt(variance);

  const lastMonth = timeline[timeline.length - 1];
  const [lastYear, lastMonthNum] = lastMonth.monthKey.split('-').map(Number);

  let runningBalance = cashOnHand;
  const forecast = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(lastYear, lastMonthNum - 1 + i, 1);
    const label = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    runningBalance += mean;
    forecast.push({
      month: label,
      projected: Math.round(runningBalance),
      upper: Math.round(runningBalance + stddev),
      lower: Math.round(runningBalance - stddev),
    });
  }

  return forecast;
}

function buildWaterfall(transactions) {
  const allMonths = getMonthRange(transactions);
  if (allMonths.length === 0) return [];

  const lastMonthKey = allMonths[allMonths.length - 1];
  const timeline = buildTimeline(transactions);
  const lastMonthData = timeline[timeline.length - 1];

  // Opening cash = cumulative cash at end of previous month
  const openingCash = timeline.length > 1
    ? timeline[timeline.length - 2].cumulativeCash
    : 0;

  const lastMonthTxns = transactions.filter((t) => {
    if (!t.date) return false;
    const mk = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    return mk === lastMonthKey;
  });

  const waterfall = [{ label: 'Opening Cash', value: Math.round(openingCash), type: 'start' }];

  // Revenue (aggregate)
  const totalRev = lastMonthTxns.filter((t) => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  if (totalRev > 0) {
    waterfall.push({ label: 'Revenue', value: Math.round(totalRev), type: 'positive' });
  }

  // Expenses by category
  const expByCategory = {};
  for (const t of lastMonthTxns.filter((t) => t.type === 'expense')) {
    const cat = t.category || 'Uncategorized';
    expByCategory[cat] = (expByCategory[cat] || 0) + t.amount;
  }
  for (const [cat, amount] of Object.entries(expByCategory)) {
    waterfall.push({ label: cat, value: -Math.round(amount), type: 'negative' });
  }

  const endingCash = openingCash + lastMonthData.netCash;
  waterfall.push({ label: 'Ending Cash', value: Math.round(endingCash), type: 'end' });

  return waterfall;
}

function buildCategoryBreakdown(transactions) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const allMonths = getMonthRange(transactions);

  if (allMonths.length < 2) {
    const catTotals = {};
    for (const t of expenses) {
      const cat = t.category || 'Uncategorized';
      catTotals[cat] = (catTotals[cat] || 0) + t.amount;
    }
    const total = Object.values(catTotals).reduce((s, v) => s + v, 0);
    return Object.entries(catTotals).map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentOfExpenses: total > 0 ? Math.round((amount / total) * 100) : 0,
      MoMChange: 0,
      flagged: false,
    }));
  }

  const lastMk = allMonths[allMonths.length - 1];
  const prevMk = allMonths[allMonths.length - 2];

  const byMonthCat = {};
  for (const t of expenses) {
    if (!t.date) continue;
    const mk = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    const cat = t.category || 'Uncategorized';
    if (!byMonthCat[mk]) byMonthCat[mk] = {};
    byMonthCat[mk][cat] = (byMonthCat[mk][cat] || 0) + t.amount;
  }

  const lastMonthCats = byMonthCat[lastMk] || {};
  const prevMonthCats = byMonthCat[prevMk] || {};
  const totalLastMonth = Object.values(lastMonthCats).reduce((s, v) => s + v, 0);

  const allCats = new Set([...Object.keys(lastMonthCats), ...Object.keys(prevMonthCats)]);
  return Array.from(allCats).map((cat) => {
    const curr = lastMonthCats[cat] || 0;
    const prev = prevMonthCats[cat] || 0;
    const momChange = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
    return {
      category: cat,
      amount: Math.round(curr),
      percentOfExpenses: totalLastMonth > 0 ? Math.round((curr / totalLastMonth) * 100) : 0,
      MoMChange: momChange,
      flagged: prev > 0 && curr > prev * 1.3,
    };
  }).sort((a, b) => b.amount - a.amount);
}

function buildSummary(transactions, timeline) {
  const revenues = transactions.filter((t) => t.type === 'revenue');
  const expenses = transactions.filter((t) => t.type === 'expense');

  const totalRevenue = revenues.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const cashOnHand = totalRevenue - totalExpenses;

  const allMonths = getMonthRange(transactions);
  const monthsOfData = allMonths.length;

  const sorted = transactions.filter((t) => t.date).sort((a, b) => a.date - b.date);
  const dateRange = sorted.length
    ? { start: sorted[0].date.toISOString().slice(0, 10), end: sorted[sorted.length - 1].date.toISOString().slice(0, 10) }
    : { start: '', end: '' };

  const lastMonth = timeline[timeline.length - 1] || { income: 0, expenses: 0, netCash: 0 };
  const prevMonth = timeline[timeline.length - 2] || { income: 0 };

  const nets = timeline.map((m) => m.netCash);
  const avgNet = nets.length ? nets.reduce((s, v) => s + v, 0) / nets.length : 0;
  const avgMonthlyBurn = avgNet < 0 ? Math.abs(avgNet) : 0;

  let runway = 0;
  if (avgMonthlyBurn > 0 && cashOnHand > 0) {
    runway = Math.round((cashOnHand / avgMonthlyBurn) * 10) / 10;
  } else if (avgNet > 0) {
    runway = -1; // sentinel for "profitable"
  }

  const grossMargin = totalRevenue > 0
    ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)
    : 0;

  return {
    totalTransactions: transactions.length,
    monthsOfData,
    dateRange,
    cashOnHand: Math.round(cashOnHand),
    netCashFlowMTD: Math.round(lastMonth.netCash),
    avgMonthlyBurn: Math.round(avgMonthlyBurn),
    runway,
    revenueThisMonth: Math.round(lastMonth.income),
    revenueLastMonth: Math.round(prevMonth.income),
    grossMargin,
    avgMonthlyRevenue: Math.round(revenues.reduce((s, t) => s + t.amount, 0) / (monthsOfData || 1)),
    avgMonthlyExpenses: Math.round(expenses.reduce((s, t) => s + t.amount, 0) / (monthsOfData || 1)),
  };
}

module.exports = { buildTimeline, buildForecast, buildWaterfall, buildCategoryBreakdown, buildSummary };
