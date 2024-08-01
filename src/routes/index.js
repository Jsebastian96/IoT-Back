const express = require('express');
const router = express.Router();

module.exports = (Informe) => {
    function convertDMSToDD(degrees, minutes, seconds, direction) {
        let dd = parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / (60 * 60);
        if (direction == "S" || direction == "W") {
            dd = dd * -1;
        }
        return dd;
    }

    // Obtener todos los informes
    router.get('/informes', async (req, res) => {
        try {
            const informes = await Informe.find();
            const formattedInformes = informes.map(informe => {
                const latDMS = informe.latitude.split(/[^\d\w\.]+/);
                const lngDMS = informe.longitude.split(/[^\d\w\.]+/);
                const lat = convertDMSToDD(latDMS[0], latDMS[1], latDMS[2], latDMS[3]);
                const lng = convertDMSToDD(lngDMS[0], lngDMS[1], lngDMS[2], lngDMS[3]);
                return {
                    ...informe.toObject(),
                    latitude: lat,
                    longitude: lng
                };
            });
            res.json(formattedInformes);
        } catch (error) {
            res.status(500).send(error);
        }
    });

    // Obtener un informe por ID
    router.get('/informes/:id', async (req, res) => {
        try {
            const informe = await Informe.findById(req.params.id);
            if (!informe) {
                return res.status(404).send('Informe not found');
            }
            res.json(informe);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    return router;
};
