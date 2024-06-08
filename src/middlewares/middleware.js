const jwt = require("jsonwebtoken");
require('dotenv').config();

const verifyToken = (req, res, next) => {
    let token = req.header("Authorization");
    if (!token) {
        return res.status(401).send({
            message: "Akese Ditolak!"
        });
    }
    token = token.replace("Bearer ", "");
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send({
            message: "Invalid token!"
        });
    }
};

module.exports = { verifyToken };
