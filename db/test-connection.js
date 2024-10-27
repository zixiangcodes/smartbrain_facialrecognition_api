const { testConnection } = require('./db');

console.log('Starting database connection test...');
testConnection()
    .then(() => {
        console.log('Test script completed.');
        process.exit(0);
    })
    .catch(error => {
        console.error('Test script failed:', error);
        process.exit(1);
    });