const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'backend', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'API is running' });
});

// Process audio endpoint
app.post('/process-audio', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log(`Processing audio file: ${filePath}`);

    // Call Python script to process the audio
    const pythonScript = path.join(__dirname, 'backend', 'utils', 'process_audio_simple.py');
    
    const pythonProcess = spawn('python3', [pythonScript, filePath], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'backend', 'utils') }
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorOutput);
        return res.status(500).json({ 
          error: 'Audio processing failed',
          details: errorOutput 
        });
      }

      try {
        // Parse the JSON output from Python
        const result = JSON.parse(output);
        res.json(result);
      } catch (parseError) {
        console.error('Failed to parse Python output:', output);
        res.status(500).json({ 
          error: 'Failed to parse processing results',
          output: output 
        });
      }
    });

  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Audio processing API running on port ${port}`);
});
