    // backend/middleware/admin.js

    // Middleware function to check if the logged-in user has the 'admin' role.
    // This should run AFTER the 'protect' (authentication) middleware.
    const adminOnly = (req, res, next) => {
        // Check if req.user exists (populated by 'protect' middleware)
        // and if the user's role is 'admin'.
        // Using optional chaining (?.) prevents errors if req.user is undefined.
        if (req.user?.role !== 'admin') {
          // If not an admin, send a 403 Forbidden status and an error message.
          return res.status(403).json({ error: 'Admin access required. Permission denied.' });
        }
        // If the user is an admin, pass control to the next middleware or route handler.
        next();
      };
  
      module.exports = adminOnly; // Export the middleware function
      