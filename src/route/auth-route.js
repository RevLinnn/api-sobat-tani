const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/middleware.js');

const { 
    register,
    login,
    loginWithGoogle,
    updateUser,
    GetDetailUser
} = require('../handler/auth-handler.js');

router.post('/register', register);
router.post('/login', login);
router.post('/login-with-google', loginWithGoogle);
router.put('/user', verifyToken, updateUser);
router.get('/user', verifyToken, GetDetailUser);

module.exports = router;
