const jwt = require("jsonwebtoken");

module.exports = {
  validateToken: (req, res, next) => {
    try {
        const authorizationHeaader = req.headers.authorization;
        const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
        if (!token)
            return res.status(403).send({ auth: false, message: 'No token provided.' });
        jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
          if (err)
            return res
              .status(500)
              .send({ auth: false, message: "Failed to authenticate token." });
            // if everything good, save to request for use in other routes
            console.log("decoded:",decoded);
          req.userId = decoded.id;
          next();
        });
        
    } catch (error) {
        return res.status(403).send({ auth: false, message: error.message});
    }
  },
};
