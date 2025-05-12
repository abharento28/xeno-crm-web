import { connectToDatabase, Customer } from '../src/lib/db.js';

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

  console.log(`[API] ${req.method} /api/customers request received`);

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
    
    // GET /api/customers - Get all customers
    if (req.method === 'GET') {
      try {
        console.log('[API] Querying customers collection...');
        
        // Try to use multiple collection names that might exist
        let customers = [];
        
        try {
          // Try the standard 'Customer' model first
          customers = await Customer.find({}).lean();
          console.log(`[API] Found ${customers.length} customers using Customer model`);
        } catch (modelErr) {
          console.log('[API] Error with Customer model:', modelErr.message);
          
          // If that fails, try accessing the collection directly
          try {
            const customersCollection = mongoose.connection.db.collection('customers');
            if (customersCollection) {
              customers = await customersCollection.find({}).toArray();
              console.log(`[API] Found ${customers.length} customers using direct collection access`);
            }
          } catch (collErr) {
            console.error('[API] Error accessing customers collection directly:', collErr.message);
          }
        }
        
        // Also check 'customers' collection (lowercase) if no results
        if (customers.length === 0) {
          try {
            const lowercaseCollection = mongoose.connection.db.collection('customers');
            if (lowercaseCollection) {
              customers = await lowercaseCollection.find({}).toArray();
              console.log(`[API] Found ${customers.length} customers in lowercase collection`);
            }
          } catch (err) {
            console.log('[API] Error checking lowercase collection:', err.message);
          }
        }
        
        // Format dates for all found customers
        const formattedCustomers = customers.map(customer => ({
          ...customer,
          lastOrderDate: customer.lastOrderDate ? customer.lastOrderDate.toISOString() : null,
          createdAt: customer.createdAt ? customer.createdAt.toISOString() : new Date().toISOString()
        }));
        
        console.log(`[API] Returning ${formattedCustomers.length} customers`);
        return res.status(200).json(formattedCustomers);
      } catch (error) {
        console.error('[API] Error fetching customers:', error);
        return res.status(200).json([]);  // Return empty array on error
      }
    }
    
    // POST /api/customers - Create a new customer
    if (req.method === 'POST') {
      try {
        console.log('[API] Creating new customer:', req.body);
        const customer = new Customer(req.body);
        const savedCustomer = await customer.save();
        const formattedCustomer = {
          ...savedCustomer.toObject(),
          lastOrderDate: savedCustomer.lastOrderDate ? savedCustomer.lastOrderDate.toISOString() : null,
          createdAt: savedCustomer.createdAt ? savedCustomer.createdAt.toISOString() : new Date().toISOString()
        };
        console.log('[API] Customer created successfully');
        return res.status(201).json(formattedCustomer);
      } catch (error) {
        console.error('[API] Error creating customer:', error);
        return res.status(400).json({ error: error.message });
      }
    }
    
    // DELETE /api/customers - Delete multiple customers
    if (req.method === 'DELETE') {
      try {
        // Check if request body contains customerIds array
        if (!req.body || !req.body.customerIds || !Array.isArray(req.body.customerIds)) {
          return res.status(400).json({ error: 'Request must include customerIds array' });
        }
        
        const { customerIds } = req.body;
        console.log(`[API] Deleting customers with IDs:`, customerIds);
        
        // Validate customer IDs
        if (customerIds.length === 0) {
          return res.status(400).json({ error: 'No customer IDs provided' });
        }
        
        // Delete the customers
        const deleteResult = await Customer.deleteMany({
          _id: { $in: customerIds }
        });
        
        console.log(`[API] Delete result:`, deleteResult);
        
        // Check if any customers were deleted
        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ 
            error: 'No customers found with the provided IDs',
            deletedCount: 0
          });
        }
        
        return res.status(200).json({ 
          message: `Successfully deleted ${deleteResult.deletedCount} customer(s)`,
          deletedCount: deleteResult.deletedCount
        });
      } catch (error) {
        console.error('[API] Error deleting customers:', error);
        return res.status(500).json({ error: error.message });
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