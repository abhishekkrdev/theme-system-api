const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');

dotenv.config();

const userRouter = require('./routes/userRouter');

// Set Up Server
const app = express();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port : ${PORT}`);
});

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));

// Connect To Mongo DB
mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Connected To Mongo Db');
});

app.get('/', (req, res) => res.json({ projectName: 'theme-system' }));

app.use('/auth', userRouter);
