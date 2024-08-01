const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Definir el esquema de datos
const InformeSchema = new mongoose.Schema({
    timestamp: String,
    image_base64: String,
    latitude: String,
    longitude: String
});

const Informe = mongoose.model('Informe', InformeSchema);

// Ruta para obtener todos los informes
router.get('/informes', async (req, res) => {
    try {
        const informes = await Informe.find();
        res.json(informes);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
