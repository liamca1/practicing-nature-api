const express = require('express'),
  fs = require('fs'),
  path = require('path'),
  bodyParser = require('body-parser')

const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const model = require('./models.js');

// const Entry = Models.Entry;
const Users = model.User;

mongoose.connect( process.env.CONNECTION_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true 
  });

// local connection
// mongoose.connect('mongodb://localhost:27017/practicingNatureDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});

// log requests to the server
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
const { check, validationResult } = require('express-validator');

app.use(cors());

const auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

/**** ENDPOINTS ****/

// READ: Get a user by username.
app.get(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .populate('SelectedEntries', 'Title')
      .then((user) => {
        res.status(201).json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
      });
  }
);

/* CREATE: Register a new user.
    - we'll expect JSON in this format
      {
        ID: Integer,
        Username: String, (required)
        Password: String, (required)
        Email: String, (required)
        Birthday: Date
      }
*/
app.post(
  '/users',
  // validation logic here for request
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
  ],
  (req, res) => {
    // check validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(`${req.body.Username} already exists.`);
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((err) => {
              console.error(err);
              res.status(500).send(`Error: ${err}`);
            });
        }
      })
      .catch((err) => {
        console.error(err);
        res.statuts(500).send(`Error: ${err}`);
      });
  }
);

// UPDATE: Update user details.
/* we'll expect JSON in the format
{
  Username: String, (required)
  Password: String, (required)
  Email: String, (required)
  Birthday: Date
}
*/
app.put(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true } // line makes sure that the update document is returned
    )
      .then((updateUser) => {
        res.status(201).json(updateUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
      });
  }
);

// CREATE: Add a new user entry
/*


app.put(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
          Entries: req.body.Entries
        },
      },
      { new: true } // line makes sure that the update document is returned
    )
      .then((updateUser) => {
        res.status(201).json(updateUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
      });
  }
);
*/

// DELETE: Deletes a user by username.
app.delete(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(`${req.params.Username} was not found.`);
        } else {
          res.status(200).send(`${req.params.Username} was deleted.`);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
      });
  }
);

app.get('/', (req, res) => {
  res.send('Welcome to Practicing Nature API');
});

app.use(express.static('public'));

// Error handling.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Listen for requests.
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});

