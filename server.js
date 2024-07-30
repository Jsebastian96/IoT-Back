const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
require('dotenv').config();  

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mongoUri = process.env.MONGO_URL;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado a MongoDB Atlas');
}).catch(err => {
  console.error('Error al conectar a MongoDB Atlas', err);
});

const gpsDataSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
  imagePath: String
});

const GpsData = mongoose.model('GpsData', gpsDataSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/gps', async (req, res) => {
  const { latitude, longitude } = req.body;
  const gpsData = new GpsData({ latitude, longitude });
  try {
    await gpsData.save();
    res.status(201).send({ message: 'Datos GPS guardados correctamente' });
  } catch (err) {
    res.status(400).send({ error: 'Error al guardar los datos GPS' });
  }
});

app.post('/image', upload.single('image'), async (req, res) => {
  const { latitude, longitude } = req.body;
  const imagePath = req.file.path;

  const gpsData = new GpsData({
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    imagePath: imagePath
  });

  try {
    await gpsData.save();
    res.status(201).send({ message: 'Imagen y datos GPS guardados correctamente' });
  } catch (err) {
    res.status(400).send({ error: 'Error al guardar la imagen y datos GPS' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
