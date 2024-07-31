require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Configurar multer para subir archivos
const upload = multer({ storage: multer.memoryStorage() });

// Configurar MongoDB
const mongoUrl = process.env.MONGO_URL;
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const reporteSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
  image: String  // Almacena la imagen en base64
});
const Reporte = mongoose.model('Reporte', reporteSchema);

// Configurar OpenAI API
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Endpoint para subir imágenes con latitud y longitud
app.post('/upload', upload.single('image'), async (req, res) => {
    const { latitude, longitude } = req.body;
    const image = req.file.buffer.toString('base64');
    const newReporte = new Reporte({ latitude, longitude, image });
    await newReporte.save();
    res.send('Imagen subida y guardada en MongoDB');
});

// Endpoint para recuperar reportes
app.get('/reportes', async (req, res) => {
    const reportes = await Reporte.find();
    res.json(reportes);
});

// Endpoint para analizar una imagen
app.post('/analyze/:id', async (req, res) => {
    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) {
        return res.status(404).send('Reporte no encontrado');
    }

    const prompt = `Analiza la siguiente imagen y proporciona un informe detallado: ${reporte.image}`;
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 500,
    });
    res.send(response.data.choices[0].text);
});

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
