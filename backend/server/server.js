const express = require('express');
const session = require('express-session');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const campaignRoutes = require('./routes/campaign');
const donationRoutes = require('./routes/donations');
const convertRoutes = require('./routes/convert');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',    
  credentials: true,
}));
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: 'smartgive_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/convert', convertRoutes);

// Start
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
