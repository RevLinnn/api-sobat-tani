const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/middleware.js');
const { upload } = require('../config/storage.js');

const { 
    addStatus,
    getAllStatus,
    getStatusById,
    deleteStatus,
} = require('../handler/status-handler.js');

router.post('/',verifyToken,upload.single('image'), addStatus);
router.get('/',verifyToken, getAllStatus);
router.get('/:id',verifyToken, getStatusById);
router.delete('/:id',verifyToken, deleteStatus);

module.exports = router;

