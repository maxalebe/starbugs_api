require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { MediaWikiApi } = require('openai');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const mongoCollection = process.env.MONGO_COLLECTION;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new MediaWikiApi({ apiKey: OPENAI_API_KEY });

// MongoDB Setup
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connection successful'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Star Schema
const starSchema = new mongoose.Schema({
  proper: String,
  con: String,
  bay: String,
  flam: Number,
  mag: Number,
  wikiUrl: String,
  x0: Number,
  y0: Number,
  z0: Number,
});

const Star = mongoose.model('Star', starSchema, mongoCollection);

// CORS Setup
const allowedOrigins = ["*"];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors());
app.use(express.json());

// Routes
app.get('/star-data', async (req, res) => {
  try {
    const stars = await Star.find({ mag: { $lt: 7 } });
    res.json(stars);
  } catch (error) {
    console.error('Error fetching star data:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.post('/api/wiki-summary', async (req, res) => {
  const { wikiUrl } = req.body;

  try {
    // MediaWiki API aufrufen, um den Artikelinhalt abzurufen
    const articleContent = await openai.mediaWiki(wikiUrl);

    // Auf die ersten 5 Sätze beschränken
    const summary = articleContent.split('. ').slice(0, 5).join('. ') + '.';

    res.json({ text: summary });
  } catch (error) {
    console.error('Fehler beim Abrufen der Wiki-Zusammenfassung:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Zusammenfassung' });
  }
});
// Function to extract the title from the Wikipedia URL
function extractTitleFromUrl(url) {
    const regex = /\/wiki\/([^#]+)/;
    const match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
  }
  // API endpoint to get Wikipedia article summary
  app.get('/wiki-summary', async (req, res) => {
    const wikipediaUrl = req.query.url;
    if (!wikipediaUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const title = extractTitleFromUrl(wikipediaUrl);
    if (!title) {
      return res.status(400).json({ error: 'Invalid Wikipedia URL' });
    }
    try {
      const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
      const summary = response.data.extract;
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching Wikipedia summary' });
    }
  });
// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
