// db/knexfile.js
require('dotenv').config({ path: '../.env' });

// Store the Neon database URL in a constant for clarity
const NEON_DATABASE_URL = 'postgresql://smartbrain_facialdetection_database_owner:uYyI92kfqOFj@ep-jolly-resonance-a1c7qbya.ap-southeast-1.aws.neon.tech/smartbrain_facialdetection_database';

// Common database configuration that applies to all environments
const commonConfig = {
    client: 'postgresql',
    pool: {
        min: 2,
        max: 10,
        // Add connection timeout settings for better reliability
        createTimeoutMillis: 3000,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: './migrations'
    }
};

module.exports = {
    // Development environment configuration
    development: {
        ...commonConfig,
        connection: {
            connectionString: NEON_DATABASE_URL,
            ssl: {
                require: true,
                rejectUnauthorized: true
            }
        }
    },

    // Production environment configuration
    production: {
        ...commonConfig,
        connection: {
            // Use environment variable in production for better security
            connectionString: process.env.DATABASE_URL || NEON_DATABASE_URL,
            ssl: {
                require: true,
                rejectUnauthorized: true
            }
        },
        // Additional production-specific settings
        pool: {
            ...commonConfig.pool,
            // Adjust pool settings for production if needed
            min: 2,
            max: 20  // Increased for production workload
        }
    }
};