const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = require('express').Router();

const User = require('../models/userModel');
const auth = require('../middleware/auth');

// register
router.post('/', async (req, res) => {
  try {
    const { email, password, passwordVerify } = req.body;

    // Normal validation . This can be extended using some library

    if (!email || !password || !passwordVerify) {
      return res.status(400).json({ errorMessage: 'Please enter all required field' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ errorMessage: 'Please enter a password of atleast 6 characters' });
    }

    if (password !== passwordVerify) {
      return res.status(400).json({
        errorMessage: 'Please enter the same password twice.'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        errorMessage: 'An account with this email already exists'
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // save a new user account
    const newUser = new User({
      email,
      passwordHash
    });
    const savedUser = await newUser.save();

    //log user in
    const token = jwt.sign({ user: savedUser._id }, process.env.JWT_SECRET);
    // send the token in a HTTP-only cookie

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });

    res.json({ msg: 'Registration successfull' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errorMessage: 'Issue While Registration' });
  }
});

// log in

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // validate
    if (!email || !password) {
      return res.status(400).json({ errorMessage: 'Please enter all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({ errorMessage: 'Wrong email or password' });
    }

    const passwordCorrect = await bcrypt.compare(password, existingUser.passwordHash);
    if (!passwordCorrect) {
      return res.status(401).json({ errorMessage: 'Wrong email or password' });
    }

    // sign the token

    const token = jwt.sign(
      {
        user: existingUser._id
      },
      process.env.JWT_SECRET
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });

    res.json({ msg: 'Login successfull' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errorMessage: 'Error occured while signing in' });
  }
});

router.get('/logout', (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(0)
    });

    res.json({ msg: 'Logout Successfull' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errorMessage: 'Problem while logging out' });
  }
});

router.get('/loggedIn', (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.json(false);

    jwt.verify(token, process.env.JWT_SECRET);
    res.send(true);
  } catch (err) {
    res.json(false);
  }
});

router.put('/theme', auth, async (req, res) => {
  try {
    const userId = req.user;
    const { themeName } = req.body;
    await User.findByIdAndUpdate({ _id: userId }, { theme: themeName || 'light' });
    res.json({ msg: 'Theme Changed Successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errorMessage: 'Problem while updating theme' });
  }
});

router.get('/theme', auth, async (req, res) => {
  try {
    const userId = req.user;
    const result = await User.findById({ _id: userId });
    res.json(result.theme || 'light');
  } catch (err) {
    res.send();
  }
});

module.exports = router;
