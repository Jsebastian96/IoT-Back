const express = require('express');
const multer = require('multer');
const router = express.Router();
const inform = require('../models/informe');


// Obtener la foto de un estudiante por ID
router.get('/:id/photo', async (req, res) => {
  try {
    const inform = await inform.findById(req.params.id).select('photo_estudiante');
    if (!inform) {
      return res.status(404).send('inform not found');
    }
    res.json(inform);
  } catch (error) {
    console.error('Error fetching inform photo:', error);
    res.status(500).send(error.message);
  }
});

// Obtener un informe por ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).send('Informe not found');
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching Informe:', error);
    res.status(500).send(error.message);
  }
});





module.exports = router;
