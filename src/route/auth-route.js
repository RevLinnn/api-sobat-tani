const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/middleware.js');

const { 
    register,
    login,
    loginWithGoogle,
    GetDetailUser
} = require('../handler/auth-handler.js');

router.post('/register', register);
router.post('/login', login);
router.post('/login-with-google', loginWithGoogle);
router.get('/user', verifyToken, GetDetailUser);

//ubah profile (nama, password,) where email
//forgot password

module.exports = router;
