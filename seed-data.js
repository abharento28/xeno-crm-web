import mongoose from 'mongoose';
import { connectToDatabase, Customer, Campaign } from './src/lib/db.js';

// Define sample customer data
const sampleCustomers = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-123-4567',
    totalSpend: 1250.50,
    lastOrderDate: new Date('2025-04-15'),
    visitCount: 8,
    createdAt: new Date('2024-12-15')
  },
  {
    name: 'Emily Johnson',
    email: 'emily.johnson@example.com',
    phone: '555-987-6543',
    totalSpend: 3450.75,
    lastOrderDate: new Date('2025-05-02'),
    visitCount: 12,
    createdAt: new Date('2025-01-20')
  },
  {
    name: 'Michael Rodriguez',
    email: 'michael.r@example.com',
    phone: '555-234-5678',
    totalSpend: 890.25,
    lastOrderDate: new Date('2025-04-28'),
    visitCount: 4,
    createdAt: new Date('2025-03-10')
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    phone: '555-345-6789',
    totalSpend: 5250.00,
    lastOrderDate: new Date('2025-05-05'),
    visitCount: 15,
    createdAt: new Date('2024-11-05')
  },
  {
    name: 'David Patel',
    email: 'david.patel@example.com',
    phone: '555-456-7890',
    totalSpend: 2150.25,
    lastOrderDate: new Date('2025-04-20'),
    visitCount: 9,
    createdAt: new Date('2025-02-15')
  }
];

// Define sample campaign data
const sampleCampaigns = [
  {
    name: 'Spring Sale 2025',
    audienceQuery: [
      { field: 'totalSpend', operator: '>', value: '1000', logicGate: 'AND' },
      { field: 'lastOrderDate', operator: '>', value: '2025-01-01' }
    ],
    createdAt: new Date('2025-03-15'),
    summary: 'Spring promotion targeting high-value customers with recent purchases'
  },
  {
    name: 'Win-back Campaign',
    audienceQuery: [
      { field: 'lastOrderDate', operator: '<', value: '2025-01-01', logicGate: 'AND' },
      { field: 'totalSpend', operator: '>', value: '500' }
    ],
    createdAt: new Date('2025-04-01'),
    summary: 'Re-engagement campaign for customers who haven\'t purchased recently'
  },
  {
    name: 'New Product Launch',
    audienceQuery: [
      { field: 'visitCount', operator: '>', value: '5', logicGate: 'OR' },
      { field: 'totalSpend', operator: '>', value: '2000' }
    ],
    createdAt: new Date('2025-04-20'),
    summary: 'Introducing our new product line to frequent visitors and high-value customers'
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    const mongoose = await connectToDatabase();
    
    // Get DB name from connection string
    const dbName = mongoose.connection.db.databaseName;
    console.log(`Connected to database: ${dbName}`);
    
    // List existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    
    // Seed customers collection
    console.log('\nSeeding customers collection...');
    const customerResults = await Customer.insertMany(sampleCustomers);
    console.log(`Added ${customerResults.length} customers`);
    
    // Seed campaigns collection
    console.log('\nSeeding campaigns collection...');
    const campaignResults = await Campaign.insertMany(sampleCampaigns);
    console.log(`Added ${campaignResults.length} campaigns`);

    console.log('\nSeed completed successfully! Database now contains:');
    
    // Verify seed
    const customerCount = await Customer.countDocuments();
    const campaignCount = await Campaign.countDocuments();
    
    console.log(`- ${customerCount} customers`);
    console.log(`- ${campaignCount} campaigns`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase(); 