import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001; // Use different port to avoid conflicts

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
  res.json({ status: 'healthy', message: 'Transcription API is running' });
});

// Transcription endpoint
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const inputLanguage = req.body.inputLanguage || req.body.input_language;
    const outputLanguage = req.body.outputLanguage || req.body.output_language;
    
    console.log(`Transcribing audio file: ${filePath}`);
    if (inputLanguage) console.log(`Input language: ${inputLanguage}`);
    if (outputLanguage) console.log(`Output language: ${outputLanguage}`);

    // Call Python script to transcribe the audio
    const pythonScript = path.join(__dirname, 'backend', 'utils', 'transcribe_audio.py');
    
    // Build command arguments
    const args = [pythonScript, filePath];
    if (inputLanguage) args.push(inputLanguage);
    if (outputLanguage) args.push(outputLanguage);
    
    const pythonProcess = spawn('python3', args, {
      cwd: __dirname,
      env: { 
        ...process.env, 
        PYTHONPATH: path.join(__dirname, 'backend', 'utils'),
        PATH: process.env.PATH + ':' + path.join(__dirname, 'higgs boson', 'venv', 'bin')
      }
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
          error: 'Transcription failed',
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
          error: 'Failed to parse transcription results',
          output: output 
        });
      }
    });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Transcription API running on port ${port}`);
});
