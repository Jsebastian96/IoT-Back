require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
const app = express();

app.use(express.json());

// Configurar multer para subir archivos
const upload = multer({ storage: multer.memoryStorage() });

// Configurar MongoDB
const mongoUrl = process.env.MONGO_URL;
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB Atlas'))
.catch(err => {
    console.error('Error al conectar a MongoDB Atlas:', err.message);
    process.exit(1);
});

// Definir el esquema de la colección 'Informe'
const informeSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    image_base64: String,
    latitude: String,
    longitude: String
});
const Informe = mongoose.model('Informe', informeSchema);

// Configurar OpenAI API
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Endpoint para subir reportes
app.post('/reportes', upload.single('image'), async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const image_base64 = req.file.buffer.toString('base64');
        const newInforme = new Informe({ image_base64, latitude, longitude });
        await newInforme.save();
        res.status(201).send('Reporte subido y guardado en MongoDB');
    } catch (error) {
        res.status(500).send('Error al guardar el reporte');
    }
});

// Endpoint para recuperar reportes
app.get('/reportes', async (req, res) => {
  try {
      const reportes = await Informe.find();
      res.json(reportes);
  } catch (error) {
      res.status(500).send('Error al obtener los reportes');
  }
});

// Endpoint para analizar una imagen
app.post('/analyze/:id', async (req, res) => {
    try {
        const report = await Informe.findById(req.params.id);
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: `Analiza la siguiente imagen y proporciona un informe detallado: ${report.image_base64}`,
            max_tokens: 500,
        });
        res.send(response.data.choices[0].text);
    } catch (error) {
        console.error('Error al analizar la imagen:', error);
        res.status(500).send('Error al analizar la imagen');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
