// Import libraries
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors');
// const knex = require('knex')

// Create backend app
const app = express();

// Set server to use port 3000 by default (though can switch to another if the default port is in use)
const PORT = process.env.PORT || 3000;

// Initialize other libraries in backend app.
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Mock database for testing purposes (to be later removed)
const database = {
	users: [
		{
			id: '0001',
			name: 'John',
			email: 'john@gmail.com',
			password: 'password',
			entries: 0,
			joined: new Date()
		},
		{
			id: '0002',
			name: 'Sally',
			email: 'sally@gmail.com',
			password: 'password',
			entries: 0,
			joined: new Date()
		}
	]
}

// >> STARTUP
// Initial startup response for backend server is running and on which port
app.listen(PORT, () => {
	console.log(`The backend app is running on port ${PORT}`);
});;

// Initial call to backend server
app.get('/', (req, res) => {
	res.send(`Backend app/server is working and running on port ${PORT}!`);
})

// New route to get and check all users
app.get('/users', (req, res) => {
	// Create a new array with user information, excluding passwords
	const safeUsers = database.users.map(user => {
		const { password, ...userWithoutPassword } = user;
		return userWithoutPassword;
	});

	res.json(safeUsers);
})

// Function to generate the next sequential ID
function getNextId() {
	const maxId = database.users.reduce((max, user) => {
		const userId = parseInt(user.id, 10);
		return userId > max ? userId : max;
	}, 0);

	return (maxId + 1).toString().padStart(4, '0');
}

// >> DELETE USER
app.delete('/users', (req, res) => {
	const { name, email, password } = req.body;

	// Find the index of the user in the database
	const userIndex = database.users.findIndex(user =>
		user.name === name &&
		user.email === email &&
		user.password === password
	);

	if (userIndex !== -1) {
		// Remove the user from the database
		const deletedUser = database.users.splice(userIndex, 1)[0];

		// Return success message along with the deleted user info (excluding password)
		const { password: _, ...deletedUserInfo } = deletedUser;
		res.json({
			message: "User successfully deleted",
			deletedUser: deletedUserInfo
		});
	} else {
		// If no matching user is found, return an error
		res.status(404).json({
			error: "User not found. Please check the provided credentials."
		});
	}
});

/*
We have a few routes, these will be endpoints for front-end
- register --> POST = user
- signin --> POST = success/fail
- profile/:userId --> GET = user
- image --> PUT --> user
*/

// >> REGISTER
// Call register route (GET) to check if working
app.get('/register', (req, res) => {
	res.send('The register route is working!')
})

app.post('/register', (req, res) => {
	const { email, name, password } = req.body;

	// Regular expression for email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	// Regular expression for name validation
	// This allows letters, spaces, and common name punctuation (hyphen and apostrophe)
	// It requires at least one letter and disallows other symbols
	const nameRegex = /^[a-zA-Z]+[a-zA-Z\s'-]*$/;

	if (email && name && password) {
		// Check if the email is in a valid format
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				error: "Invalid email format. Please provide a valid email address."
			});
		}

		// Check if the name is in a valid format
		if (!nameRegex.test(name)) {
			return res.status(400).json({
				error: "Invalid name format. Name must start with a letter and can only contain letters, spaces, hyphens, and apostrophes."
			});
		}

		const newUser = {
			id: getNextId(),
			// this id to be set in sequence later
			name: name,
			email: email,
			password: password,
			entries: 0,
			joined: new Date()
		};

		database.users.push(newUser);

		res.json({
			user: newUser,
			message: `User ${name} has been successfully registered!`
		});
	} else {
		res.status(400).json({
			error: "Invalid registration details. Please provide email, name, and password."
		});
	}
});

// >> SIGNIN
// Call signin route (GET) to check if working
app.get('/signin', (req, res) => {
	res.send('The signin route is working!')
});

// signin route (POST)
app.post('/signin', (req, res) => {
	const { name, email, password } = req.body;

	// Search for a user in the database that matches the provided name, email, and password
	const user = database.users.find(user =>
		user.name === name &&
		user.email === email &&
		user.password === password
	);

	// If a matching user is found, send success response
	if (user) {
		res.status(200).json(`Success! Welcome, user ${user.name}!`);
	} else {
		// If no user is found or data provided incorrectly, send error response
		res.status(400).json('Invalid credentials. Please try again.');
	}

});

// >> PROFILE
// Call profile route (GET) to check if working
app.get('/profile', (req, res) => {
	res.send('The profile route is working!')
});

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;

	const user = database.users.find(user => user.id === id);

	if (user) {
		// Create a safe user object without the password
		const { password, ...safeUser } = user;
		return res.json(safeUser);
	} else {
		return res.status(404).json('User with that id does not exist in database!');
	}
});

// >> IMAGE
app.get('/image', (req, res) => {
	res.send('The image route is working!')
});

app.post('/image', (req, res) => {
	const { id } = req.body;
	let found = false;
	database.users.forEach(user => {
		if (user.id === id) {
			found = true;
			user.entries++
			return res.json(user.entries);
		}
	})
	if (!found) {
		return res.status(400).json('User not found');
	}
});

// app.post('/signin', (req, res) => {
// 	// res.json('signin')
// 	if (req.body.email === database.users[0].email && req.body.password === database.users[0].password) {
// 		res.json('success');
// 	} else {
// 		res.status(400).json('error logging in');
// 	}
// })

// Check if name, email and password of John (single user) matches
// if (req.body.name === database.users.name && req.body.email === database.users.email && req.body.password === database.users.password) {
// 	res.status(200).json(`Success! Welcome, user ${database.users.name}!`);
// } else {
// 	res.status(400).json('Unknown error!');
// }

// Check if all required fields are provided
// if (!name || !email || !password) {
// 	return res.status(400).json('Name, email, and password are required');
// }

// Check if name exists but email and password are not provided or incorrect
// if (user.name === name && !email || !password) {
// 	return res.status(400).json('User exists but email and password are not provided or incorrect.');
// }

// Find a user that matches the provided email
// const user = database.users.find(user => user.email === email);

// if (!user) {
// 	return res.status(400).json('User not found');
// }

