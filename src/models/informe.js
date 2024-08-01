const mongoose = require('mongoose');

const InformeSchema = new mongoose.Schema({
  longitude: { type: String, required: true },
  latitude: { type: String, required: true },
  image_base64: { type: String }
});

const Student = mongoose.models.Student || mongoose.model('Informe', InformeSchema);

module.exports = Informe;
