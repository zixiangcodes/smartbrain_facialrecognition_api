const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { db } = require('../../db/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Create the Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Import node-fetch using dynamic import for compatibility
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

// Clarifai helper function
const getClarifaiRequestOptions = (imageUrl) => {
    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": process.env.CLARIFAI_USER_ID,
            "app_id": process.env.CLARIFAI_APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": imageUrl
                    }
                }
            }
        ]
    });

    return {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + process.env.CLARIFAI_PAT
        },
        body: raw
    };
};

// Routes
// Note: All routes need to be prefixed with /.netlify/functions/api
// Home
app.get('/.netlify/functions/api', (req, res) => {
    res.json({
        status: 'success',
        message: 'Backend API is running',
        timestamp: new Date()
    });
});

// Face detection route
app.post('/.netlify/functions/api/detect-face', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        const requestOptions = getClarifaiRequestOptions(imageUrl);
        const response = await fetch('https://api.clarifai.com/v2/models/face-detection/outputs', requestOptions);

        if (!response.ok) {
            throw new Error(`Clarifai API responded with status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error calling Clarifai API:', error);
        res.status(500).json({ error: 'Failed to process the image', details: error.message });
    }
});

// Users routes
app.get('/.netlify/functions/api/users', async (req, res) => {
    try {
        const users = await db('users')
            .select('id', 'name', 'email', 'entries', 'joined');

        if (!users || users.length === 0) {
            return res.status(404).json({
                status: 'warning',
                message: 'No users found in database'
            });
        }

        res.json({
            status: 'success',
            count: users.length,
            users
        });
    } catch (err) {
        console.error('Users endpoint error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Unable to get users',
            error: err.message
        });
    }
});

// Authentication Routes
app.post('/.netlify/functions/api/register', async (req, res) => {
    const { email, name, password } = req.body;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;

    try {
        // Input validation
        if (!email || !name || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields (email, name, password) are required'
            });
        }

        // Validation checks
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }

        const existingUser = await db('users')
            .where('email', '=', email)
            .first();

        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Email address is already registered'
            });
        }

        if (!nameRegex.test(name)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid name format'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 6 characters long'
            });
        }

        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        const [user] = await db('users')
            .insert({
                email: email.toLowerCase(),
                name: name.trim(),
                password: hash,
                pass_orig: password,  // Adding back the pass_orig field
                entries: 0,
                joined: new Date()
            })
            .returning(['id', 'name', 'email', 'entries', 'joined']);

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            user
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Unable to register user',
            error: err.message
        });
    }
});

// Sign-in route
app.post('/.netlify/functions/api/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
        }

        const user = await db('users')
            .where('email', '=', email)
            .first();

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        const { password: _, ...safeUser } = user;
        res.json({
            status: 'success',
            user: safeUser
        });
    } catch (err) {
        console.error('Sign in error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error during sign in',
            error: err.message
        });
    }
});

// Profile route
app.get('/.netlify/functions/api/profile/:id', async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        const user = await db('users')
            .where({ id })
            .first();

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const { password, ...safeUser } = user;
        res.json({
            status: 'success',
            user: safeUser
        });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error getting user profile',
            error: err.message
        });
    }
});

// Image entry route
app.post('/.netlify/functions/api/image', async (req, res) => {
    const { id } = req.body;

    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        const [updatedUser] = await db('users')
            .where('id', '=', id)
            .increment('entries', 1)
            .returning(['id', 'entries']);

        if (!updatedUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            entries: updatedUser.entries
        });
    } catch (err) {
        console.error('Image count update error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Unable to update entries',
            error: err.message
        });
    }
});

// Clear entries route
app.post('/.netlify/functions/api/clear-entries', async (req, res) => {
    const { id } = req.body;

    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        const [updatedUser] = await db('users')
            .where('id', '=', id)
            .update('entries', 0)
            .returning(['id', 'name', 'entries']);

        if (!updatedUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            message: `Entries reset for user ${updatedUser.name}`,
            entries: updatedUser.entries
        });
    } catch (err) {
        console.error('Clear entries error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Unable to clear entries',
            error: err.message
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global Error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        details: err.message
    });
});

// Export the serverless handler
module.exports.handler = serverless(app);