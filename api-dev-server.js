import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import customersHandler from './api/customers.js';
import campaignsHandler from './api/campaigns.js';
import { connectToDatabase } from './src/lib/db.js';

const app = express();
const PORT = 3000;

// Middleware for all requests
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log middleware for debugging
app.use((req, res, next) => {
  console.log(`[DEV SERVER] ${req.method} ${req.url}`);
  next();
});

// Connect to the database on startup
connectToDatabase()
  .then(() => console.log('Database connected at startup'))
  .catch(err => console.error('Database connection error at startup:', err));

// Create middleware to make each request look like a serverless function
const createServerlessMiddleware = (handler) => {
  return async (req, res) => {
    console.log(`[DEV SERVER] Processing ${req.method} request to ${req.url}`);
    
    try {
      // Add timestamp for debugging
      req.startTime = Date.now();
      
      // Clone the request body to avoid mutations affecting logging
      const reqBody = JSON.parse(JSON.stringify(req.body || {}));
      console.log(`[DEV SERVER] Request body:`, Object.keys(reqBody).length > 0 ? reqBody : 'Empty body');
      
      // Intercept response methods to log
      const originalJson = res.json;
      res.json = function(body) {
        const executionTime = Date.now() - req.startTime;
        console.log(`[DEV SERVER] Response (${executionTime}ms):`, 
          body ? (Array.isArray(body) ? `Array with ${body.length} items` : typeof body) : 'Empty response');
        return originalJson.call(this, body);
      };
      
      // Invoke the serverless handler
      await handler(req, res);
    } catch (error) {
      console.error('[DEV SERVER] Error in serverless handler:', error);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  };
};

// Define routes with the same pattern as Vercel
app.all('/api/customers', createServerlessMiddleware(customersHandler));
app.all('/api/campaigns', createServerlessMiddleware(campaignsHandler));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  console.log(`[DEV SERVER] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found', path: req.url });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║    Development API server running on port ${PORT}        ║
║                                                       ║
║    API Endpoints:                                     ║
║    - GET/POST http://localhost:${PORT}/api/customers      ║
║    - GET/POST http://localhost:${PORT}/api/campaigns      ║
║    - GET      http://localhost:${PORT}/api/health         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
}); 