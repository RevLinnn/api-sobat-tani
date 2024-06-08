const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/middleware.js');
const { upload } = require('../config/storage.js');

const { 
    addBookmark,
    getBookmarkById,
    getAllBookmark,
    deleteBookmarkById,

} = require('../handler/bookmark-handler.js');

//bookmark
router.post('/add',verifyToken,upload.single('image'), addBookmark);
// router.patch('/bookmark/:id',verifyToken, addBookmark);
router.get('/get/:id',verifyToken, getBookmarkById);
router.get('/get',verifyToken, getAllBookmark);
router.delete('/delete/:id',verifyToken, deleteBookmarkById);




module.exports = router;

