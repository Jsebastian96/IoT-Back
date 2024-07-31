require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Verificar que las variables de entorno se cargaron correctamente
console.log('MONGO_URL:', process.env.MONGO_URL);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

// Configurar multer para subir archivos
const upload = multer({ storage: multer.memoryStorage() });

// Configurar MongoDB
const mongoUrl = process.env.MONGO_URL;
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado a MongoDB Atlas');
}).catch(err => {
  console.error('Error al conectar a MongoDB Atlas:', err);
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
    try {
        await newReporte.save();
        res.send('Imagen subida y guardada en MongoDB');
    } catch (err) {
        console.error('Error al guardar los datos:', err);
        res.status(500).send('Error al guardar los datos');
    }
});

// Endpoint para recuperar reportes
app.get('/reportes', async (req, res) => {
    try {
        const reportes = await Reporte.find();
        res.json(reportes);
    } catch (err) {
        console.error('Error al recuperar los reportes:', err);
        res.status(500).send('Error al recuperar los reportes');
    }
});

// Endpoint para analizar una imagen
app.post('/analyze/:id', async (req, res) => {
    try {
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
    } catch (err) {
        console.error('Error al analizar la imagen:', err);
        res.status(500).send('Error al analizar la imagen');
    }
});

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
