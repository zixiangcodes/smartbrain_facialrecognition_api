const knex = require('knex');

// Create a function to get a new database connection
const getDb = () => {
    const config = {
        client: 'pg',
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        },
        pool: {
            min: 0,
            max: 1,
            idleTimeoutMillis: 1000,
            acquireTimeoutMillis: 1000,
            createTimeoutMillis: 1000
        }
    };
    return knex(config);
};

// Create a fresh connection for each request
const getDbConnection = () => {
    return getDb();
};

// Test connection function
async function testConnection() {
    const testDb = getDb();
    try {
        await testDb.raw('SELECT 1');
        console.log('Database connection successful!');
        await testDb.destroy();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        await testDb.destroy();
        return false;
    }
}

module.exports = { db: getDbConnection, testConnection };


/*
// old code v3 broken but working ?
const knex = require('knex');

// Create a function to get a new database connection for serverless environments
const getDb = () => {
    // Basic configuration that works well in serverless
    const config = {
        client: 'pg',
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        },
        pool: {
            min: 0, // Start with no connections
            max: 1, // Keep only one connection per instance
            idleTimeoutMillis: 1000, // Release connections quickly
            acquireTimeoutMillis: 1000,
            createTimeoutMillis: 1000
        }
    };

    return knex(config);
};

// Create a connection pool
const db = getDb();

// Test connection function
async function testConnection() {
    const testDb = getDb(); // Create a new connection for testing
    try {
        await testDb.raw('SELECT 1');
        console.log('Database connection successful!');
        await testDb.destroy(); // Clean up test connection
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        await testDb.destroy(); // Clean up even if test fails
        return false;
    }
}

module.exports = { db, testConnection };
*/

// Old code V2:
/*
const knex = require('knex');

const config = {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
        min: 0,
        max: 7,
        idleTimeoutMillis: 10000,
        acquireTimeoutMillis: 10000
    },
    ssl: { rejectUnauthorized: false }
};

const db = knex(config);

async function testConnection() {
    try {
        await db.raw('SELECT 1');
        console.log('Database connection successful!');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

module.exports = { db, testConnection };
*/

// Old code:
/*
const knex = require('knex');
// const pg = require('pg');

// // Environment-specific configuration
// const environment = process.env.NODE_ENV || 'development';

// // Parse the DATABASE_URL for both environments to ensure consistent handling
// const parseConnectionString = (url) => {
//     try {
//         const connectionObject = new URL(url);
//         return {
//             host: connectionObject.hostname,
//             port: connectionObject.port,
//             user: connectionObject.username,
//             password: connectionObject.password,
//             database: connectionObject.pathname.split('/')[1],
//             ssl: { rejectUnauthorized: false }
//         };
//     } catch (error) {
//         console.error('Error parsing database URL:', error);
//         return null;
//     }
// };

// // Configuration object for different environments
// const config = {
//     development: {
//         client: 'pg',
//         connection: process.env.DATABASE_URL
//             ? parseConnectionString(process.env.DATABASE_URL)
//             : {
//                 host: process.env.DB_HOST,
//                 port: process.env.DB_PORT,
//                 user: process.env.DB_USER,
//                 password: process.env.DB_PASSWORD,
//                 database: process.env.DB_NAME,
//                 ssl: { rejectUnauthorized: false }
//             },
//         pool: {
//             min: 2,
//             max: 10,
//             createTimeoutMillis: 3000,
//             acquireTimeoutMillis: 30000,
//             idleTimeoutMillis: 30000,
//             reapIntervalMillis: 1000,
//             createRetryIntervalMillis: 100
//         }
//     },
//     production: {
//         client: 'pg',
//         connection: process.env.DATABASE_URL,
//         pool: {
//             min: 2,
//             max: 10,
//             createTimeoutMillis: 3000,
//             acquireTimeoutMillis: 30000,
//             idleTimeoutMillis: 30000,
//             reapIntervalMillis: 1000,
//             createRetryIntervalMillis: 100
//         },
//         ssl: true // Changed from an object to boolean for production
//     }
// };

// // Enhanced database initialization with connection verification
// let db;
// try {
//     db = knex(config[environment]);
//     console.log(`Database configuration initialized in ${environment} mode`);
// } catch (error) {
//     console.error('Failed to initialize database connection:', error);
//     process.exit(1); // Exit if we can't initialize the database
// }

// // Enhanced test connection function with timeout
// async function testConnection(timeout = 5000) {
//     return Promise.race([
//         new Promise(async (resolve, reject) => {
//             try {
//                 await db.raw('SELECT 1');
//                 console.log(`✅ Database connection successful in ${environment} mode!`);
//                 resolve(true);
//             } catch (error) {
//                 console.error('❌ Database connection failed:', {
//                     message: error.message,
//                     code: error.code,
//                     stack: error.stack
//                 });
//                 reject(error);
//             }
//         }),
//         new Promise((_, reject) =>
//             setTimeout(() => reject(new Error('Connection timeout')), timeout)
//         )
//     ]);
// }

// module.exports = {
//     db,
//     testConnection
// };
*/