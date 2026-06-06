const express = require('express');
const cors = require('cors');
const analyzeRoute = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', analyzeRoute);

app.listen(PORT, () => {
  console.log(`Frankly server running on http://localhost:${PORT}`);
});
