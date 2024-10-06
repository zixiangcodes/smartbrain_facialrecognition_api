const express = require('express');
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors');
// https://www.npmjs.com/package/bcrypt-nodejs
const knex = require('knex')

const db = knex({
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		user: 'postgres',
		password: 'admin',
		database: 'smartbrain'
	}
});

// Initialize connection and login to DB
// const db = knex({
// 	client: 'pg',
// 	connection: {
// 		host: '127.0.0.1',
// 		user: 'postgres',
// 		password: 'admin',
// 		database: 'smartbrain'
// 	}
// });

// db.select('*').from('users').then(data => {
// 	console.log(data);
// });

// console.log(db.select('*').from('users'));

db.select('*').from('users').then(data => {
	console.log(data);
});

console.log(db.select('*').from('users'));

//127.0.0.1 means home or localhost

const app = express();

app.use(express.json());

app.use(cors());

app.get('/', (req, res) => {
	res.send('this is working');
})

// app.get('/', (req, res) => {
// 	res.send(db.users); // previously use 'database'
// })

// app.post('/signin', (req, res) => {
// 	db.select('email', 'hash').from('login')
// 		.where('email', '=', req.body.email)
// 		.then(data => {
// 			const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
// 			console.log(isValid);
// 			if (isValid) {
// 				return db.select('*').from('users')
// 					.where('email', '=', req.body.email)
// 					.then(user => {
// 						console.log(user);
// 						res.json(user[0])
// 					})
// 					.catch(err => res.status(400).json('unable to get user'))
// 			} else {
// 				res.status(400).json('wrong credentials')
// 			}
// 		})
// 		.catch(err => res.status(400).json('wrong credentials'))
// })

// app.post('/register', (req, res) => {
// 	const { email, name, password } = req.body;
// 	const hash = bcrypt.hashSync(password);
// 	// bcrypt.hash(password, null, null, function(err, hash) {
// 	//    	// Store hash in your password DB.
// 	//    	console.log("Encrypted Password: " + hash);
// 	// });
// 	db.transaction(trx => {
// 		trx.insert({
// 			hash: hash,
// 			email: email,
// 		})
// 			.into('login')
// 			.returning('email')
// 			.then(loginEmail => {
// 				return trx('users')
// 					.returning('*')
// 					.insert({
// 						email: loginEmail[0],
// 						name: name,
// 						joined: new Date()
// 					})
// 					.then(user => {
// 						res.json(user[0]);
// 					})
// 			})
// 			.then(trx.commit)
// 			.catch(trx.rollback)
// 	})
// 		.catch(err => res.status(400).json('unable to register'))
// })

// app.get('/profile/:id', (req, res) => {
// 	const { id } = req.params;
// 	db.select('*').from('users').where({ id })
// 		.then(user => {
// 			console.log(user)
// 			if (user.length) {
// 				res.json(user[0]);
// 			} else {
// 				res.status(400).json('Not found');
// 			}

// 		})
// 		.catch(err => res.status(400).json('error getting'))
// 	// if (!found) {
// 	// 	res.status(400).json('not found');
// 	// }
// })

// database.users.forEach(user => {
// 	if(user.id === id) {
// 		found = true;
// 		return res.json(user);
// 	}
// })

// app.put('/image', (req, res) => {
// 	const { id } = req.body;
// 	db('users').where('id', '=', id)
// 		.increment('entries', 1)
// 		.returning('entries')
// 		.then(entries => {
// 			res.json(entries[0]);
// 		})
// 		.catch(err => res.status(400).json('unable to get entries'))
// })

// let found = false;
// database.users.forEach(user => {
// 	if(user.id === id) {
// 		found = true;
// 		user.entries++
// 		return res.json(user.entries);
// 	}
// })
// if (!found) {
// 	res.status(400).json('not found');
// }

app.listen(3000, () => {
	console.log('app is running on port 3000')
});