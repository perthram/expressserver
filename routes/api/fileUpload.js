const express = require('express');
const router = express.Router();
const multer = require('multer');
const excelToJson = require('convert-excel-to-json');

const upload = multer();

router.post('/', upload.single('quizdata'), (req, res) => {
  const result = excelToJson({
    source: req.file.buffer,
  });
  return res.json({ sucess: true, result });
});

module.exports = router;
