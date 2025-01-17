const knex = require('knex');

// Environment-specific configuration
const environment = process.env.NODE_ENV || 'development';

// Configuration object for different environments
const config = {
    development: {
        client: 'pg',
        connection: {
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
        ssl: {
            rejectUnauthorized: false
        }
    }
};

// Initialize database connection
const db = knex(config[environment]);

// Modified test connection function for production
async function testConnection() {
    try {
        await db.raw('SELECT 1');
        console.log(`✅ Database connection successful in ${environment} mode!`);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return false;
    }
}

module.exports = {
    db,
    testConnection
};