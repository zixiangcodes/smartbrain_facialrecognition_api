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
	origin: FRONTEND_URL || 'http://localhost:3001',
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

// Mock database for testing purposes (to be later removed)
// const database = {
// 	users: [
// 		{
// 			id: '0000',
// 			name: 'Admin',
// 			email: 'admin@mail.com',
// 			password: 'admin',
// 			entries: 0,
// 			joined: new Date()
// 		},
// 		{
// 			id: '0001',
// 			name: 'John',
// 			email: 'john@gmail.com',
// 			password: 'password',
// 			entries: 0,
// 			joined: new Date()
// 		},
// 		{
// 			id: '0002',
// 			name: 'Sally',
// 			email: 'sally@gmail.com',
// 			password: 'password',
// 			entries: 0,
// 			joined: new Date()
// 		}
// 	]
// }

// Helper function to get next ID (keep this)
// function getNextId() {
// 	const maxId = db.users.reduce((max, user) => {
// 		const userId = parseInt(user.id, 10);
// 		return userId > max ? userId : max;
// 	}, 0);

// 	return (maxId + 1).toString().padStart(4, '0');
// }

// Initial call to backend server
app.get('/', (req, res) => {
	// res.send(`Backend app/server is working and running on port ${PORT}!`);
	res.json({ message: `Backend app/server is working and running on port ${PORT}!` });
})

// [ROUTES]
// New route to get and check all users
app.get('/users', async (req, res) => {
	try {
		const users = await db('users')
			.select('id', 'name', 'email', 'entries', 'joined');
		res.json(users);
	} catch (err) {
		console.error(err);
		res.status(400).json('Unable to get users');
	}
});

// Function to generate the next sequential ID
// function getNextId() {
// 	const maxId = db.users.reduce((max, user) => {
// 		const userId = parseInt(user.id, 10);
// 		return userId > max ? userId : max;
// 	}, 0);

// 	return (maxId + 1).toString().padStart(4, '0');
// }

// >> DELETE USER
// OLD CODE
app.delete('/users', async (req, res) => {
	const { email, password } = req.body;

	try {
		// First find the user
		const user = await db('users')
			.where('email', '=', email)
			.first();

		if (user && await bcrypt.compare(password, user.password)) {
			// Delete the user
			const deletedCount = await db('users')
				.where('email', '=', email)
				.del();

			res.json({
				message: "User successfully deleted",
				deletedCount
			});
		} else {
			res.status(404).json({
				error: "User not found or invalid credentials"
			});
		}
	} catch (err) {
		console.error(err);
		res.status(400).json('Unable to delete user');
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

// app.post('/register', (req, res) => {
// 	const { email, name, password } = req.body;

// 	/*
// 	bcrypt.hash(password, null, null, function (err, hash) {
// 		console.log("---\n" + hash)
// 		// Store hash in your password DB.
// 		// Need to encrypt password later on, perhaps after connecting with frontend + backend + DB.
// 	});
// 	*/

// 	// Regular expression for email validation
// 	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 	// Regular expression for name validation
// 	// This allows letters, spaces, and common name punctuation (hyphen and apostrophe)
// 	// It requires at least one letter and disallows other symbols
// 	const nameRegex = /^[a-zA-Z]+[a-zA-Z\s'-]*$/;

// 	if (!email || !name || !password) {
// 		return res.status(400).json({
// 			error: "Invalid registration details. Please provide email, name, and password."
// 		});
// 	}

// 	// Check if the email is in a valid format
// 	if (!emailRegex.test(email)) {
// 		return res.status(400).json({
// 			error: "Invalid email format. Please provide a valid email address."
// 		});
// 	}

// 	// Check if the name is in a valid format
// 	if (!nameRegex.test(name)) {
// 		return res.status(400).json({
// 			error: "Invalid name format. Name must start with a letter and can only contain letters, spaces, hyphens, and apostrophes."
// 		});
// 	}

// 	const newUser = {
// 		id: getNextId(),
// 		// this id to be set in sequence later
// 		name: name,
// 		email: email,
// 		password: password, // In a real app, hash this password
// 		entries: 0,
// 		joined: new Date()
// 	};

// 	database.users.push(newUser);
// 	const { password: _, ...safeUser } = newUser;

// 	res.json({
// 		user: newUser,
// 		message: `User ${name} has been successfully registered!`
// 	});
// });

// New version when connecting to database
app.post('/register', async (req, res) => {
	const { email, name, password } = req.body;

	try {
		const saltRounds = 10;
		const hash = await bcrypt.hash(password, saltRounds);

		const [user] = await db('users')
			.insert({
				email: email,
				name: name,
				password: hash,
				entries: 0,
				joined: new Date()
			})
			.returning(['id', 'name', 'email', 'entries', 'joined']);

		res.json(user);
	} catch (err) {
		console.error(err);
		res.status(400).json('Unable to register');
	}
});

// >> SIGNIN
// Call signin route (GET) to check if working
app.get('/signin', (req, res) => {
	// res.send('The signin route is working!')
	res.json({ message: `The signin route is working!` });
});

// signin route (POST)
// app.post('/signin', (req, res) => {
// 	const { email, password } = req.body;

// 	if (!email || !password) {
// 		return res.status(400).json('Incorrect form submission');
// 	}

// 	// Search for a user in the database that matches the provided email and password
// 	const user = database.users.find(user =>
// 		user.email === email &&
// 		user.password === password
// 	);

// 	if (user) {
// 		const { password, ...safeUser } = user;
// 		res.json(safeUser);
// 		// If a matching user is found, send success response
// 	} else {
// 		res.status(400).json('Invalid credentials');
// 		// If no user is found or data provided incorrectly, send error response
// 	}
// });

// new version for database
app.post('/signin', async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await db('users')
			.where('email', '=', email)
			.first();

		if (user && await bcrypt.compare(password, user.password)) {
			const { password, ...safeUser } = user;
			res.json(safeUser);
		} else {
			res.status(400).json('Invalid credentials');
		}
	} catch (err) {
		console.error(err);
		res.status(400).json('Error logging in');
	}
});

// >> PROFILE
// Call profile route (GET) to check if working
app.get('/profile', (req, res) => {
	// res.send('The profile route is working!')
	res.json({ message: `The profile route is working!` });
});

// app.get('/profile/:id', (req, res) => {
// 	const { id } = req.params;

// 	const user = database.users.find(user => user.id === id);

// 	if (user) {
// 		// Create a safe user object without the password
// 		const { password, ...safeUser } = user;
// 		return res.json(safeUser);
// 	} else {
// 		return res.status(404).json('User with that id does not exist in database!');
// 	}
// });

// new version connect with database
app.get('/profile/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const user = await db('users')
			.where({ id })
			.first();

		if (user) {
			const { password, ...safeUser } = user;
			res.json(safeUser);
		} else {
			res.status(404).json('User not found');
		}
	} catch (err) {
		console.error(err);
		res.status(400).json('Error getting user');
	}
});

// >> IMAGE
app.get('/image', (req, res) => {
	// res.send('The image route is working!')
	res.json({ message: `The image route is working!` });
});

// app.post('/image', (req, res) => {
// 	console.log('Received image request for user id:', req.body);
// 	const { id } = req.body;
// 	let found = false;
// 	database.users.forEach(user => {
// 		if (user.id === id) {
// 			found = true;
// 			user.entries++;
// 			return res.json(user.entries);
// 		}
// 	});
// 	if (!found) {
// 		return res.status(400).json('User not found');
// 	}
// });

// new version for database
app.post('/image', async (req, res) => {
	const { id } = req.body;

	try {
		const [entries] = await db('users')
			.where('id', '=', id)
			.increment('entries', 1)
			.returning('entries');

		res.json(entries);
	} catch (err) {
		console.error(err);
		res.status(400).json('Unable to update entries');
	}
});

// >> CLEAR SINGLE USER ENTRIES
app.post('/clear-entries', async (req, res) => {
	const { id } = req.body;

	try {
		const [updatedUser] = await db('users')
			.where('id', '=', id)
			.update('entries', 0)
			.returning(['id', 'name', 'entries']);

		if (updatedUser) {
			console.log(`Entries of user '${updatedUser.name}' has been successfully reset to 0!`);
			res.json(updatedUser.entries);
		} else {
			res.status(404).json('User not found');
		}
	} catch (err) {
		console.error(err);
		res.status(400).json('Unable to clear entries');
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