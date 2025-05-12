import { connectToDatabase, Campaign } from '../src/lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`[API] ${req.method} /api/campaigns request received`);

  try {
    // Connect to the database
    console.log('[API] Connecting to database...');
    const mongoose = await connectToDatabase();
    console.log('[API] Connected to MongoDB');
    
    // Log available collections
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('[API] Available collections:', collections.map(c => c.name));
    } catch (err) {
      console.error('[API] Unable to list collections:', err.message);
    }
    
    // GET /api/campaigns - Get all campaigns
    if (req.method === 'GET') {
      try {
        console.log('[API] Querying campaigns collection...');
        
        // Try to use multiple collection names that might exist
        let campaigns = [];
        
        try {
          // Try the standard 'Campaign' model first
          campaigns = await Campaign.find({}).lean();
          console.log(`[API] Found ${campaigns.length} campaigns using Campaign model`);
        } catch (modelErr) {
          console.log('[API] Error with Campaign model:', modelErr.message);
          
          // If that fails, try accessing the collection directly
          try {
            const campaignsCollection = mongoose.connection.db.collection('campaigns');
            if (campaignsCollection) {
              campaigns = await campaignsCollection.find({}).toArray();
              console.log(`[API] Found ${campaigns.length} campaigns using direct collection access`);
            }
          } catch (collErr) {
            console.error('[API] Error accessing campaigns collection directly:', collErr.message);
          }
        }
        
        // Also check 'campaigns' collection (lowercase) if no results
        if (campaigns.length === 0) {
          try {
            const lowercaseCollection = mongoose.connection.db.collection('campaigns');
            if (lowercaseCollection) {
              campaigns = await lowercaseCollection.find({}).toArray();
              console.log(`[API] Found ${campaigns.length} campaigns in lowercase collection`);
            }
          } catch (err) {
            console.log('[API] Error checking lowercase collection:', err.message);
          }
        }
        
        // Format dates for all found campaigns
        const formattedCampaigns = campaigns.map(campaign => ({
          ...campaign,
          createdAt: campaign.createdAt ? campaign.createdAt.toISOString() : new Date().toISOString()
        }));
        
        console.log(`[API] Returning ${formattedCampaigns.length} campaigns`);
        return res.status(200).json(formattedCampaigns);
      } catch (error) {
        console.error('[API] Error fetching campaigns:', error);
        return res.status(200).json([]);  // Return empty array on error
      }
    }
    
    // POST /api/campaigns - Create a new campaign
    if (req.method === 'POST') {
      try {
        console.log('[API] Creating new campaign:', req.body);
        const campaign = new Campaign(req.body);
        const savedCampaign = await campaign.save();
        const formattedCampaign = {
          ...savedCampaign.toObject(),
          createdAt: savedCampaign.createdAt ? savedCampaign.createdAt.toISOString() : new Date().toISOString()
        };
        console.log('[API] Campaign created successfully');
        return res.status(201).json(formattedCampaign);
      } catch (error) {
        console.error('[API] Error creating campaign:', error);
        return res.status(400).json({ error: error.message });
      }
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[API] Error processing request:', error);
    
    // Provide a helpful error response
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(500).json({ error: 'Database connection error', details: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 