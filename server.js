const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
const app = express();

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

// Definir el esquema de la imagen
const imageSchema = new mongoose.Schema({
    data: Buffer,
    contentType: String,
    latitude: Number,
    longitude: Number
});
const Image = mongoose.model('Image', imageSchema);

// Configurar OpenAI API
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Endpoint para subir imágenes
app.post('/upload', upload.single('image'), async (req, res) => {
    const newImage = new Image({
        data: req.file.buffer,
        contentType: req.file.mimetype,
        latitude: req.body.latitude,
        longitude: req.body.longitude
    });
    await newImage.save();
    res.send('Imagen subida y guardada en MongoDB');
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
        const image = await Image.findById(req.params.id);
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: `Analiza la siguiente imagen y proporciona un informe detallado: ${image.data.toString('base64')}`,
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
