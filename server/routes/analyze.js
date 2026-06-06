const express = require('express');
const multer = require('multer');
const { parseCSV } = require('../lib/parser');
const { detectAnomalies } = require('../lib/anomalies');
const { calculateScores } = require('../lib/scoring');
const { buildTimeline, buildForecast, buildWaterfall, buildCategoryBreakdown, buildSummary } = require('../lib/forecasting');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/analyze', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded.' });
  }

  const csvString = req.file.buffer.toString('utf-8');

  // Defer heavy synchronous work so the event loop stays responsive
  setImmediate(() => {
    try {
      const transactions = parseCSV(csvString);

      if (transactions.length === 0) {
        return res.status(400).json({ error: 'No valid transactions found in CSV.' });
      }

      const anomalies = detectAnomalies(transactions);
      const confidenceScores = calculateScores(transactions, anomalies);
      const cashFlowTimeline = buildTimeline(transactions);
      const summary = buildSummary(transactions, cashFlowTimeline);
      const forecast = buildForecast(cashFlowTimeline, summary.cashOnHand);
      const waterfallData = buildWaterfall(transactions);
      const categoryBreakdown = buildCategoryBreakdown(transactions);

      res.json({
        summary,
        confidenceScores,
        cashFlowTimeline,
        forecast,
        categoryBreakdown,
        anomalies,
        waterfallData,
      });
    } catch (err) {
      console.error('Analysis error:', err);
      res.status(500).json({ error: 'Analysis failed. Check your CSV format and try again.' });
    }
  });
});

module.exports = router;
