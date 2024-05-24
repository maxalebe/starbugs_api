require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');

const port = process.env.API_PORT || 3000;

const mongoUri = process.env.MONGO_URI;
const mongoCollection = process.env.MONGO_COLLECTION;

const starSchema = new mongoose.Schema({
    proper: String,
    con: String,
    bay: String,
    flam: Number,
    mag: Number,
});

const Star = mongoose.model('Star', starSchema, mongoCollection);
console.log("connecting to " + mongoUri);
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connection successful'))
    .catch(err => console.error('MongoDB connection error:', err));

const corsOptions = {
    origin: process.env.FRONTEND_URL,
};

app.use(cors());
app.use(express.json());

app.get('/api/constellation', async (req, res) => {
    const { constellation } = req.query;
    console.log(`calling /api/constellation for: ${constellation}`);
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
        console.log(`Found stars: ${stars.length}`);
    } catch (error) {
        console.error('Fehler beim Abrufen der Sterndaten:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

app.get('/star-data', async (req, res) => {
    try {
      // Find stars with mag less than 8 using Mongoose
      const filteredStars = await Star.find({ mag: { $lt: 8 } });
  
      // Send filtered star data as JSON to the frontend
      res.json(filteredStars);
    } catch (error) {
      console.error('Error fetching star data:', error);
      res.status(500).json({ message: 'Internal Server Error' }); // Adjust error message as needed
    }
  });

app.get('/', (req, res) => {
    // console.log("calling root endpoint");
    res.send('Welcome to the Starbugs API');
});

app.listen(port, () => {
    console.log(`API script is running. Port ${port}`);
});
