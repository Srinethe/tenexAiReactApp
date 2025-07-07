import dotenv from 'dotenv';
import { UserModel } from '../models/User.js';

dotenv.config();

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  console.log('Database URL:', process.env.DATABASE_URL);
  
  try {
    const isConnected = await UserModel.testConnection();
    
    if (isConnected) {
      console.log('✅ Database connection successful!');
      
      // Test creating a user
      console.log('\nTesting user creation...');
      try {
        const testUser = await UserModel.createUser({
          email: 'test@example.com',
          password: 'testpassword123',
          role: 'user'
        });
        console.log('✅ User created successfully:', { id: testUser.id, email: testUser.email });
        
        // Test finding the user
        const foundUser = await UserModel.findByEmail('test@example.com');
        console.log('✅ User found:', foundUser ? 'Yes' : 'No');
        
        // Test password verification
        const isValidPassword = await UserModel.verifyPassword(testUser, 'testpassword123');
        console.log('✅ Password verification:', isValidPassword ? 'Success' : 'Failed');
        
      } catch (error) {
        console.log('❌ User creation test failed:', error);
      }
      
    } else {
      console.log('❌ Database connection failed!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testDatabaseConnection(); 