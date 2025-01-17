const knex = require('knex');
const pg = require('pg');

// Environment-specific configuration
const environment = process.env.NODE_ENV || 'development';

// Parse the DATABASE_URL for both environments to ensure consistent handling
const parseConnectionString = (url) => {
    try {
        const connectionObject = new URL(url);
        return {
            host: connectionObject.hostname,
            port: connectionObject.port,
            user: connectionObject.username,
            password: connectionObject.password,
            database: connectionObject.pathname.split('/')[1],
            ssl: { rejectUnauthorized: false }
        };
    } catch (error) {
        console.error('Error parsing database URL:', error);
        return null;
    }
};

// Configuration object for different environments
const config = {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL
            ? parseConnectionString(process.env.DATABASE_URL)
            : {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                ssl: { rejectUnauthorized: false }
            },
        pool: {
            min: 2,
            max: 10,
            createTimeoutMillis: 3000,
            acquireTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 100
        }
    },
    production: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        pool: {
            min: 2,
            max: 10,
            createTimeoutMillis: 3000,
            acquireTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 100
        },
        ssl: true // Changed from an object to boolean for production
    }
};

// Enhanced database initialization with connection verification
let db;
try {
    db = knex(config[environment]);
    console.log(`Database configuration initialized in ${environment} mode`);
} catch (error) {
    console.error('Failed to initialize database connection:', error);
    process.exit(1); // Exit if we can't initialize the database
}

// Enhanced test connection function with timeout
async function testConnection(timeout = 5000) {
    return Promise.race([
        new Promise(async (resolve, reject) => {
            try {
                await db.raw('SELECT 1');
                console.log(`✅ Database connection successful in ${environment} mode!`);
                resolve(true);
            } catch (error) {
                console.error('❌ Database connection failed:', {
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                });
                reject(error);
            }
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), timeout)
        )
    ]);
}

module.exports = {
    db,
    testConnection
};