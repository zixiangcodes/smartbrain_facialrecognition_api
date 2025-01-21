require('dotenv').config();

const commonConfig = {
    client: 'postgresql',
    pool: {
        min: 0,
        max: 7,
        idleTimeoutMillis: 10000,
        acquireTimeoutMillis: 10000
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: './migrations'
    }
};

module.exports = {
    development: {
        ...commonConfig,
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        }
    },
    production: {
        ...commonConfig,
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        }
    }
};