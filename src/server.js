const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// Conexión a MongoDB
const MONGO_URL = "mongodb+srv://juanm:369@cluster0.ff92cnc.mongodb.net/Cluster0?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Modelos
const InformeSchema = new mongoose.Schema({
    timestamp: String,
    image_base64: String,
    latitude: String,
    longitude: String
});

const Informe = mongoose.model('Informe', InformeSchema);

// Rutas
const indexRoutes = require('./src/routes/index');
app.use('/', indexRoutes(Informe));

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
