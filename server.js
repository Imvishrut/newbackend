const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const analyzeCSV = require('./utils/analyzeCSV.js');

const app = express();
const port = 3000;

// Multer config for file upload
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Endpoint to upload and analyze CSV
app.post('/analyze-transactions', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'CSV file is required.' });
      }
  
      const filePath = req.file.path;
  
      try {
        const result = await analyzeCSV(filePath);
        res.status(200).json(result);
      } catch (processingError) {
        console.error('Error analyzing CSV:', processingError);
        res.status(500).json({ error: 'Failed to process the CSV file.' });
      } finally {
        // Clean up uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
  
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      res.status(400).json({ error: uploadError.message || 'Failed to upload file.' });
    }
  });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
