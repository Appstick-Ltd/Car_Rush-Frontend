const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public directory without caching for instant live updates
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 0,
  etag: false
}));

// In-memory data store for deletion and contact requests (can be connected to DB)
const deletionRequests = [];
const contactMessages = [];

// Game Metadata API
app.get('/api/game-info', (req, res) => {
  res.json({
    name: 'Car Rush: Draw & Drive',
    version: '1.0.0',
    developer: 'Appstick Ltd',
    genre: 'Physics Puzzle / Casual Mobile Game',
    platforms: ['Android', 'iOS'],
    rating: '4.9',
    totalDownloads: '50,000+',
    ageRating: 'Everyone / PEGI 3 / Families Friendly (COPPA compliant)',
    features: [
      'Draw & Drive 2D Physics Engine',
      'Multi-Biome Environments (Meadow, Sunset, Night, Magma)',
      '100+ Handcrafted & Procedural Levels',
      'Firebase Cloud Sync for Progress',
      'Child & Family Safe AdMob Compliance',
      'Full Offline Mode Playability'
    ]
  });
});

// Endpoint for Google Play / GDPR Data Deletion Requests
app.post('/api/data-deletion', (req, res) => {
  const { deviceId, email, reason } = req.body;
  if (!deviceId && !email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide either a Device ID or Email address.'
    });
  }

  const requestRecord = {
    id: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    deviceId: deviceId || 'N/A',
    email: email || 'N/A',
    reason: reason || 'User requested removal',
    status: 'Scheduled',
    createdAt: new Date().toISOString()
  };

  deletionRequests.push(requestRecord);
  console.log(`[Data Deletion Request] ${requestRecord.id} recorded for ${email || deviceId}`);

  return res.json({
    success: true,
    message: 'Your data deletion request has been submitted successfully and will be processed within 48 hours in compliance with Google Play and GDPR policies.',
    ticketId: requestRecord.id
  });
});

// Contact / Feedback endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.'
    });
  }

  const contactRecord = {
    id: `MSG-${Date.now()}`,
    name,
    email,
    subject: subject || 'General Feedback',
    message,
    createdAt: new Date().toISOString()
  };

  contactMessages.push(contactRecord);
  console.log(`[Contact Message] From ${name} (${email}): ${subject}`);

  return res.json({
    success: true,
    message: 'Thank you for reaching out! Our team will respond shortly.',
    ticketId: contactRecord.id
  });
});

// Clean Routes for HTML Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get(['/privacy', '/privacy-policy'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get(['/terms', '/terms-and-conditions', '/tos'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// 404 Fallback to Index
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Car Rush: Draw & Drive - Web App & Privacy Portal  `);
  console.log(`  Server running at: http://localhost:${PORT}          `);
  console.log(`  Privacy Policy:   http://localhost:${PORT}/privacy  `);
  console.log(`  Terms of Service: http://localhost:${PORT}/terms    `);
  console.log(`=======================================================`);
});
