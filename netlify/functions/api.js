const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { db } = require('../../db/db');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config();

// Create the Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

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
// Home
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Backend API is running',
        timestamp: new Date()
    });
});

// Face detection route
app.post('/api/detect-face', async (req, res) => {
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
app.get('/users', async (req, res) => {
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
// Register endpoint with detailed validation
app.post('/register', async (req, res) => {
    const { email, name, password } = req.body;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;

    try {
        // Comprehensive input validation
        if (!email || !name || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields (email, name, password) are required'
            });
        }

        // Email format validation
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format. Please provide a valid email address (e.g., user@example.com)'
            });
        }

        // Check for existing user
        const existingUser = await db('users')
            .where('email', '=', email)
            .first();

        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Email address is already registered'
            });
        }

        // Name format validation
        if (!nameRegex.test(name)) {
            return res.status(400).json({
                status: 'error',
                message: 'Name must be between 2-50 characters and can only contain letters, spaces, hyphens, and apostrophes'
            });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 6 characters long'
            });
        }

        // Process registration with secure password hashing
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        const [user] = await db('users')
            .insert({
                email: email.toLowerCase(),
                name: name.trim(),
                password: hash,
                pass_orig: password,
                entries: 0,
                joined: new Date()
            })
            .returning(['id', 'name', 'email', 'entries', 'joined']);

        // Return safe user data (excluding password)
        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                entries: user.entries,
                joined: user.joined
            }
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

// Sign-in endpoint with secure authentication
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
        }

        // Find user and verify credentials
        const user = await db('users')
            .where('email', '=', email)
            .first();

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Return user data without sensitive information
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

// Profile Management Routes
app.get('/profile/:id', async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        // Fetch user profile
        const user = await db('users')
            .where({ id })
            .first();

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Return safe user data
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

// Image Entry Management Routes
app.post('/image', async (req, res) => {
    const { id } = req.body;

    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        // Increment user's entry count
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

// Entry Reset Route
app.post('/clear-entries', async (req, res) => {
    const { id } = req.body;

    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        // Reset user's entries to zero
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

// Global error handler for unexpected errors
app.use((err, req, res, next) => {
    console.error('Global Error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        details: err.message
    });
});

// Convert Express app to serverless function
exports.handler = serverless(app);