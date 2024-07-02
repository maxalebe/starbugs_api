require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const app = express();

const port = process.env.API_PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const mongoCollection = process.env.MONGO_COLLECTION;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connection successful'))
    .catch(err => console.error('MongoDB connection error:', err));

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5000', "https://newstar.maximebeck.de"];
const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/constellation', async (req, res) => {
    const { constellation } = req.query;
    try {
        const stars = await Star.find({
            con: { $regex: constellation, $options: 'i' },
            $or: [
                { bay: { $nin: [null, ''] } },
                { flam: { $nin: [null, ''] } },
                { proper: { $nin: [null, ''] } }
            ]
        }).sort({ mag: 1 });
        res.status(200).send(stars);
    } catch (error) {
        console.error('Error fetching star data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/star-data', async (req, res) => {
    try {
        const filteredStars = await Star.find({ mag: { $lt: 7 } });
        res.json(filteredStars);
    } catch (error) {
        console.error('Error fetching star data:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.post('/api/wiki-summary', async (req, res) => {
    const { wikiUrl } = req.body;

    const OPENAI_API_URL = 'https://api.openai.com/v1/completions';
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        data: JSON.stringify({
            prompt: `Summarize the Wikipedia page at ${wikiUrl} in two lines.`,
            max_tokens: 50,
            temperature: 0.3
        }),
        url: OPENAI_API_URL
    };

    try {
        const response = await axios(requestOptions);
        const summary = response.data.choices[0].text.trim();
        res.status(200).json({ summary });
    } catch (error) {
        console.error('Error fetching wiki summary:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to the Starbugs API');
});

app.listen(port, () => {
    console.log(`API script is running. Port ${port}`);
});