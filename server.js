const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

const reporteSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
  image: String  // Almacena la imagen en base64
});

const Reporte = mongoose.model('Reporte', reporteSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

app.post('/gps', async (req, res) => {
  const { latitude, longitude } = req.body;
  const reporte = new Reporte({ latitude, longitude });
  try {
    await reporte.save();
    res.status(201).send({ message: 'Datos GPS guardados correctamente' });
  } catch (err) {
    console.error('Error al guardar los datos GPS:', err);
    res.status(400).send({ error: 'Error al guardar los datos GPS', details: err.message });
  }
});

app.post('/image', upload.single('image'), async (req, res) => {
  const { latitude, longitude } = req.body;
  const imagePath = req.file.path;

  try {
    const image = fs.readFileSync(imagePath, { encoding: 'base64' });
    const reporte = new Reporte({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      image: image
    });

    await reporte.save();
    fs.unlinkSync(imagePath); // Elimina el archivo local después de convertirlo a base64
    res.status(201).send({ message: 'Imagen y datos GPS guardados correctamente' });
  } catch (err) {
    console.error('Error al guardar la imagen y datos GPS:', err);
    res.status(400).send({ error: 'Error al guardar la imagen y datos GPS', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
