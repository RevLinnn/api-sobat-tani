const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/middleware.js');

const { 
    getPlantDetails
} = require('../handler/plant-handler.js');


router.get('/',verifyToken, getPlantDetails);



module.exports = router;

