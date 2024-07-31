require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
const app = express();

// Configurar multer para subir archivos
const upload = multer({ storage: multer.memoryStorage() });

// Configurar MongoDB
mongoose.connect('mongodb://localhost:27017/imagenes', { useNewUrlParser: true, useUnifiedTopology: true });
const imageSchema = new mongoose.Schema({ data: Buffer, contentType: String });
const Image = mongoose.model('Image', imageSchema);

// Configurar OpenAI API
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// Endpoint para subir imágenes
app.post('/upload', upload.single('image'), async (req, res) => {
    const newImage = new Image({ data: req.file.buffer, contentType: req.file.mimetype });
    await newImage.save();
    res.send('Imagen subida y guardada en MongoDB');
});

// Endpoint para recuperar imágenes
app.get('/images', async (req, res) => {
    const images = await Image.find();
    res.json(images);
});

// Endpoint para analizar una imagen
app.post('/analyze/:id', async (req, res) => {
    const image = await Image.findById(req.params.id);
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `Analiza la siguiente imagen y proporciona un informe detallado: ${image.data.toString('base64')}`,
        max_tokens: 500,
    });
    res.send(response.data.choices[0].text);
});

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
