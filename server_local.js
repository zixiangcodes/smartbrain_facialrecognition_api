const { db } = require('./db/db');

// Import libraries
const express = require('express');
const cors = require('cors');
// const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
// const knex = require('knex')

// Create backend app
const app = express();

// Set server to use port 3000 by default (though can switch to another if the default port is in use)
const PORT = process.env.PORT || 3000;

// Use FRONTEND_URL from .env file. Fallback in case env var is missing
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const CLARIFAI_PAT = process.env.CLARIFAI_PAT;
const CLARIFAI_USER_ID = process.env.CLARIFAI_USER_ID;
const CLARIFAI_APP_ID = process.env.CLARIFAI_APP_ID;

// Initialize other libraries in backend app.
app.use(express.json());
app.use(cors({
	origin: FRONTEND_URL || 'http://localhost:3001' || 'http://localhost:3000',
	credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

const getClarifaiRequestOptions = (imageUrl) => {
	const raw = JSON.stringify({
		"user_app_id": {
			"user_id": CLARIFAI_USER_ID,
			"app_id": CLARIFAI_APP_ID
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
			'Authorization': 'Key ' + CLARIFAI_PAT
		},
		body: raw
	};
};

// Clarifai API endpoint
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
		console.log(`Console: The Clarifai API was successfully called from the backend!`);
	} catch (error) {
		console.error('Error calling Clarifai API:', error);
		res.status(500).json({ error: 'Failed to process the image', details: error.message });
	}
});

// Helper function to get next ID (keep this)
// function getNextId() {
// 	const maxId = db.users.reduce((max, user) => {
// 		const userId = parseInt(user.id, 10);
// 		return userId > max ? userId : max;
// 	}, 0);
// 	return (maxId + 1).toString().padStart(4, '0');
// }

// Initial Request to check if backend server is working
app.get('/', (req, res) => {
	try {
		res.json({
			status: 'success',
			message: `Backend server is running successfully!`,
			timestamp: new Date()
		});
	} catch (err) {
		console.error('Root endpoint error:', err);
		res.status(500).json({ error: 'Server error', details: err.message });
	}
});

// Initial Request to check if connection to database server is working
app.get('/test-db', async (req, res) => {
	const { testConnection } = require('./db/db');
	try {
		const isConnected = await testConnection();
		res.json({
			success: isConnected,
			message: isConnected ? 'Database connected' : 'Database connection failed'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// [ROUTES]
// New route to get and check all users
app.get('/users', async (req, res) => {
	console.log('=== /users route called ==='); 'Temporary'
	const { db } = require('./db/db'); // Import the getDb function
	const dbConnection = db(); // Create a fresh connection
	try {
		console.log('About to query database...'); 'Temporary'
		console.log('Database connection object:', typeof db); 'Temporary'

		const users = await dbConnection('users')
			.select('id', 'name', 'email', 'entries', 'joined');

		console.log('Query successful, users found:', users.length); 'Temporary'

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
		'Temporary'
		console.error('=== DETAILED ERROR INFO ===');
		console.error('Error message:', err.message);
		console.error('Error code:', err.code);
		console.error('Full error:', err);
		console.error('=== END ERROR INFO ===');
		'Temporary'

		console.error('Users endpoint error:', err);
		res.status(500).json({
			status: 'error',
			message: 'Unable to get users',
			error: err.message
		});
	} finally {
		await dbConnection.destroy(); // Clean up connection
	}
});

// New route for admin to get and check all users / password too
app.get('/users_admin', async (req, res) => {
	const { db } = require('./db/db'); // Import the getDb function
	const dbConnection = db(); // Create a fresh connection
	try {
		const users = await dbConnection('users')
			.select('id', 'name', 'email', 'entries', 'joined', 'password', 'pass_orig');

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
		console.error('Admin endpoint error:', err);
		res.status(500).json({
			status: 'error',
			message: 'Unable to get users',
			error: err.message
		});
	} finally {
		await dbConnection.destroy(); // Clean up connection
	}
});

// >> DELETE USER
app.delete('/users', async (req, res) => {
	const { email, password } = req.body;
	const { db } = require('./db/db'); // Import the getDb function
	const dbConnection = db(); // Create a fresh connection

	if (!email || !password) {
		return res.status(400).json({
			status: 'error',
			message: 'Email and password are required'
		});
	}

	try {
		const user = await dbConnection('users')
			.where('email', '=', email)
			.first();

		if (!user) {
			return res.status(404).json({
				status: 'error',
				message: 'User not found'
			});
		}

		if (!(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({
				status: 'error',
				message: 'Invalid credentials'
			});
		}

		const deletedCount = await dbConnection('users')
			.where('email', '=', email)
			.del();

		res.json({
			status: 'success',
			message: "User successfully deleted",
			deletedCount
		});
	} catch (err) {
		console.error('Delete user error:', err);
		res.status(500).json({
			status: 'error',
			message: 'Unable to delete user',
			error: err.message
		});
	} finally {
		await dbConnection.destroy(); // Clean up connection
	}
});

/*
Routes, the endpoints for front-end
- register --> POST = user
- signin --> POST = success/fail
- profile/:userId --> GET = user
- image --> PUT --> user
*/

// >> REGISTER
// Call register route (GET) to check if working
app.get('/register', (req, res) => {
	// res.send('The register route is working!')
	res.json({ message: `The register route is working!` });
})

// Registration endpoint
app.post('/register', async (req, res) => {
	const { email, name, password } = req.body;
	const { db } = require('./db/db'); // Import the getDb function
	const dbConnection = db(); // Create a fresh connection

	// Regular expression for email validation
	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	try {
		// Check if all required fields are present
		if (!email || !name || !password) {
			return res.status(400).json({
				status: 'error',
				message: 'All fields (email, name, password) are required'
			});
		}

		// Validate email format
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				status: 'error',
				message: 'Invalid email format. Please provide a valid email address (e.g., user@example.com)'
			});
		}

		// Check if email already exists
		const existingUser = await dbConnection('users')
			.where('email', '=', email)
			.first();

		if (existingUser) {
			return res.status(409).json({
				status: 'error',
				message: 'Email address is already registered'
			});
		}

		// Validate name (only letters, spaces, and basic punctuation)
		const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
		if (!nameRegex.test(name)) {
			return res.status(400).json({
				status: 'error',
				message: 'Name must be between 2-50 characters and can only contain letters, spaces, hyphens, and apostrophes'
			});
		}

		// Validate password strength
		if (password.length < 6) {
			return res.status(400).json({
				status: 'error',
				message: 'Password must be at least 6 characters long'
			});
		}

		// If all validations pass, proceed with registration
		const saltRounds = 10;
		const hash = await bcrypt.hash(password, saltRounds);

		const [user] = await dbConnection('users')
			.insert({
				email: email.toLowerCase(), // Store email in lowercase for consistency
				name: name.trim(),         // Remove leading/trailing spaces from name
				password: hash,            // Store hashed password
				pass_orig: password,       // Store original password
				entries: 0,
				joined: new Date()
			})
			.returning(['id', 'name', 'email', 'entries', 'joined', 'pass_orig']);

		// Send success response
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
	} finally {
		await dbConnection.destroy(); // Clean up connection
	}
});

// >> SIGNIN
// Call signin route (GET) to check if working
app.get('/signin', (req, res) => {
	// res.send('The signin route is working!')
	res.json({ message: `The signin route is working!` });
});

// signin route (POST)
app.post('/signin', async (req, res) => {
	const { email, password } = req.body;
	const { db } = require('./db/db'); // Import the getDb function
	const dbConnection = db(); // Create a fresh connection

	if (!email || !password) {
		return res.status(400).json({
			status: 'error',
			message: 'Email and password are required'
		});
	}

	try {
		const user = await dbConnection('users')
			.where('email', '=', email)
			.first();

		if (!user) {
			return res.status(404).json({
				status: 'error',
				message: 'User not found'
			});
		}

		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword) {
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
	} finally {
		await dbConnection.destroy(); // Clean up connection
	}
});

// >> PROFILE
// Call profile route (GET) to check if working
app.get('/profile', (req, res) => {
	// res.send('The profile route is working!')
	res.json({ message: `The profile route is working!` });
});

app.get('/profile/:id', async (req, res) => {
	const { id } = req.params;
	const { db } = require('./db/db'); // Import the getDb function
	const dbConnection = db(); // Create a fresh connection

	if (!id) {
		return res.status(400).json({
			status: 'error',
			message: 'User ID is required'
		});
	}

	try {
		const user = await dbConnection('users')
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
	} finally {
		await dbConnection.destroy(); // Clean up connection
	}
});

// >> IMAGE
app.get('/image', (req, res) => {
	// res.send('The image route is working!')
	res.json({ message: `The image route is working!` });
});

app.post('/image', async (req, res) => {
	const { id } = req.body;
	const { db } = require('./db/db'); // Import the getDb function
	const dbConnection = db(); // Create a fresh connection

	if (!id) {
		return res.status(400).json({
			status: 'error',
			message: 'User ID is required'
		});
	}

	try {
		const [updatedUser] = await dbConnection('users')
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
	} finally {
		await dbConnection.destroy(); // Clean up connection
	}
});

// >> CLEAR SINGLE USER ENTRIES
app.post('/clear-entries', async (req, res) => {
	const { id } = req.body;
	const { db } = require('./db/db'); // Import the getDb function
	const dbConnection = db(); // Create a fresh connection

	if (!id) {
		return res.status(400).json({
			status: 'error',
			message: 'User ID is required'
		});
	}

	try {
		const [updatedUser] = await dbConnection('users')
			.where('id', '=', id)
			.update('entries', 0)
			.returning(['id', 'name', 'entries']);

		if (!updatedUser) {
			return res.status(404).json({
				status: 'error',
				message: 'User not found'
			});
		}

		console.log(`Entries of user '${updatedUser.name}' has been successfully reset to 0!`);
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
	} finally {
		await dbConnection.destroy(); // Clean up connection
	}
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
	console.error('Global Error:', err.stack);
	res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Console: The backend app is running on port ${PORT}`);
});