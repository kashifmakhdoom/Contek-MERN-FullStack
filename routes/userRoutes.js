const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const config = require('config');

const User = require('../models/User');

// @route:  POST api/users
// @desc:   Register a user
// @access: Public
router.post('/', [
  check('name', 'Please enter a valid name').not().isEmpty(),
  check('email', 'Please enter a valid email').isEmail(),
  check('password', 'Please enter password exactly 6 or more characters').isLength({min: 6})
], async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array()});
  } 
  
  const {name, email, password} = req.body;

  try {
    let user = await User.findOne({email});
    if(user) {
      return res.status(400).json({message: 'User already exist!'});
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: passwordHash
    });

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(payload, config.get('jwtSecret'), {
      expiresIn: 3600
    }, (err, token) => {
      if(err) throw err;
      res.json({token});
    });

  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server error!');
  }

});

module.exports = router;