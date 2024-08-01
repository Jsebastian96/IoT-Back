const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Conexión a MongoDB
const MONGO_URL = "mongodb+srv://juanm:369@cluster0.ff92cnc.mongodb.net/Cluster0?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Definir el esquema de datos
const InformeSchema = new mongoose.Schema({
    timestamp: String,
    image_base64: String,
    latitude: String,
    longitude: String
});

const Informe = mongoose.model('Informe', InformeSchema);

// Ruta para obtener todos los informes
app.get('/informes', async (req, res) => {
    try {
        const informes = await Informe.find();
        res.json(informes);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
