const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/middleware.js');
const { upload } = require('../config/storage.js');

const { 
    addPredict,
    getPredictionByIdUser,
    addBookmark,
    getBookmarkById,
    getAllBookmark,
    addMiniklopedia,
    getAllMiniklopedia,
    getMiniklopediaById,
    deleteMiniklopedia
} = require('../handler/handler.js');

//upload predict
router.post('/predict',verifyToken,upload.single('image'), addPredict);

//histori
router.get('/history',verifyToken, getPredictionByIdUser);

//bookmark
router.patch('/bookmark/:id',verifyToken, addBookmark); //ubah status
router.get('/bookmark/:id',verifyToken, getBookmarkById);
router.get('/bookmark',verifyToken, getAllBookmark);


//deskripsi

//forum? == miniklopedia
//user id, gambar, judul, deskripsi

//add forum, get forum all, get forum by id, delete forum
router.post('/miniklopedia',verifyToken,upload.single('image'), addMiniklopedia);
router.get('/miniklopedia/all',verifyToken, getAllMiniklopedia);
router.get('/miniklopedia/:id',verifyToken, getMiniklopediaById);
router.delete('/miniklopedia/:id',verifyToken, deleteMiniklopedia);



module.exports = router;

