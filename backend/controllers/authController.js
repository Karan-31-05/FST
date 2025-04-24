const User = require('../models/User');
const bcrypt = require('bcryptjs'); // works just like bcrypt
const jwt = require('jsonwebtoken');

// ✅ REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: 'student' });
    await user.save();

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ LOGIN (Modified to re-include role check)
exports.login = async (req, res) => {
  try {
    // --- STEP 1: Read role from request body again ---
    const { email, password, role } = req.body; // Added 'role' back here

    const user = await User.findOne({ email });

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log(`Login failed: Invalid credentials for email ${email}`); // Optional log
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // --- STEP 2: Add the role comparison check back ---
    if (user.role !== role) {
      console.log(`Login failed: Role mismatch for email ${email}. DB Role: '${user.role}', Requested Role: '${role}'`); // Optional log
      return res.status(403).json({
        error: `Access denied: Incorrect login portal for your role.`,
       // You could be more specific like the old message if desired:
       // error: `Access denied: You are registered as '${user.role}' but attempted to log in as '${role}'.`,
      });
    }
    // --- End of added check ---

    // If password and role match, proceed to generate token
    console.log(`Login successful for email ${email} with role ${user.role}`); // Optional log

    // Generate JWT token (payload remains the same)
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Respond with token (or token + user info if needed by frontend)
    // Sending back the actual role might be useful for the frontend
    res.json({
        token,
        role: user.role, // Consider sending role back
        name: user.name  // Consider sending name back
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};