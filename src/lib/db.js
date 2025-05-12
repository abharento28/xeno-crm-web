import mongoose from 'mongoose';

// Environment variables with fallback - EXPLICITLY using "crm" database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://as5138:Jq7h3DahtbX4XIps@cluster0.bw2rbvf.mongodb.net/crm?retryWrites=true&w=majority';

// Verify database name is "crm" - extract from URI for debugging
const getDbNameFromUri = (uri) => {
  try {
    // Extract DB name from connection string
    const dbNameMatch = uri.match(/\/([^/?]+)(\?|$)/);
    return dbNameMatch ? dbNameMatch[1] : 'unknown';
  } catch (e) {
    return 'error-parsing-uri';
  }
};

const dbName = getDbNameFromUri(MONGODB_URI);
console.log(`[DB CONFIG] Database name extracted from URI: "${dbName}"`);

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Connection counter for debugging
let connectionAttempts = 0;

// Global is used here to maintain a cached connection across hot reloads in development
// and to prevent connections growing exponentially in development due to API Route hot reloading
// https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/lib/dbConnect.js
let cached = global.mongoose;

if (!cached) {
  console.log('[DB] Initializing mongoose cache');
  cached = global.mongoose = { conn: null, promise: null };
}

// Create schemas
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  totalSpend: { type: Number, default: 0 },
  lastOrderDate: { type: Date, default: null },
  visitCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { 
  collection: 'customers',  // Force collection name to lowercase
  strict: false             // Allow fields not in schema (useful for existing data)
});

const ruleSchema = new mongoose.Schema({
  field: { type: String, required: true },
  operator: { type: String, required: true },
  value: { type: String, required: true },
  logicGate: { type: String },
}, { _id: false });

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  audienceQuery: [ruleSchema],
  createdAt: { type: Date, default: Date.now },
  summary: { type: String },
}, { 
  collection: 'campaigns',  // Force collection name to lowercase
  strict: false             // Allow fields not in schema (useful for existing data)
});

export async function connectToDatabase() {
  connectionAttempts++;
  console.log(`[DB] Connection attempt #${connectionAttempts}`);
  console.log(`[DB] Using MongoDB URI with database: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  // If we have a cached connection, use it
  if (cached.conn) {
    console.log('[DB] Using cached database connection');
    const connectedDbName = cached.conn.connection.db.databaseName;
    console.log(`[DB] Currently connected to database: "${connectedDbName}"`);
    return cached.conn;
  }

  // If not, create a new promise if one doesn't exist already
  if (!cached.promise) {
    console.log('[DB] Creating new database connection');
    
    // Connection options
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds,
      dbName: 'crm' // Force database name to be "crm"
    };

    // Enable Debug mode in development
    if (!isProduction) {
      mongoose.set('debug', true);
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        const connectedDbName = mongoose.connection.db.databaseName;
        console.log(`[DB] MongoDB connected successfully to database: "${connectedDbName}"`);
        
        // List collections to debug
        return mongoose.connection.db.listCollections().toArray()
          .then(collections => {
            const collectionNames = collections.map(c => c.name);
            console.log(`[DB] Available collections in "${connectedDbName}" database:`, collectionNames);
            
            // Create seed data if collections are empty
            if (!collectionNames.includes('customers') && !collectionNames.includes('Customers')) {
              console.log('[DB] No customers collection found - will be created on first insert');
            }
            
            if (!collectionNames.includes('campaigns') && !collectionNames.includes('Campaigns')) {
              console.log('[DB] No campaigns collection found - will be created on first insert');
            }
            
            return mongoose;
          })
          .catch(err => {
            console.error('[DB] Error listing collections:', err);
            return mongoose;
          });
      })
      .catch((error) => {
        console.error('[DB] MongoDB connection error:', error);
        cached.promise = null; // Reset promise so we can retry
        throw error;
      });
  } else {
    console.log('[DB] Using existing connection promise');
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('[DB] Connection promise rejected:', error);
    // Reset cache to allow for another attempt
    cached.promise = null;
    throw error;
  }
}

// Explicitly create models with the exact collection name
// This ensures we use the correct case for collection names
export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema, 'customers');
export const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema, 'campaigns'); 