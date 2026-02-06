const jwt = require('jsonwebtoken');
const JWT_TOKEN = "shhhhh"; // Use your secret key here

const fetchuser = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ error: "Please authenticate using a valid token" });
    }

    try {
        const data = jwt.verify(token, JWT_TOKEN);
        req.user = data; // Attach user data to request
        next(); // Proceed to next middleware
    } catch (error) {
        return res.status(401).json({ error: "Please authenticate using a valid token" });
    }
};

module.exports = fetchuser;
