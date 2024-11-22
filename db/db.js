const knex = require('knex');
const knexfile = require('./knexfile');

const db = knex(knexfile.development);

// Test the connection and basic operations
async function testConnection() {
    try {
        // Test 1: Basic connection
        await db.raw('SELECT 1');
        console.log('✅ Database connection successful!');

        // Test 2: Create a test user
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'test123',
            entries: 0,
            joined: new Date()
        };

        const [insertedUser] = await db('users')
            .insert(testUser)
            .returning(['id', 'name', 'email', 'entries', 'joined', 'password']);
        console.log('✅ Test user created:', insertedUser);

        // Test 3: Read the user back
        const foundUser = await db('users')
            .where('email', 'test@example.com')
            .first();
        console.log('✅ Test user retrieved:', foundUser);

        // Test 4: Update entries
        const [updatedUser] = await db('users')
            .where('email', 'test@example.com')
            .increment('entries', 1)
            .returning(['name', 'entries']);
        console.log('✅ Entries updated:', updatedUser);

        // Test 5: Delete test user
        const deletedCount = await db('users')
            .where('email', 'test@example.com')
            .del();
        console.log('✅ Test user deleted. Count:', deletedCount);

        console.log('🎉 All database tests passed successfully!');
    } catch (error) {
        console.error('❌ Database test failed:', error);
        // Log more details about the error
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
    } finally {
        // Close the connection
        await db.destroy();
    }
}

// Export both the database connection and the test function
module.exports = {
    db,
    testConnection
};