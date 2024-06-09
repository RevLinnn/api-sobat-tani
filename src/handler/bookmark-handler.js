const { v4: uuidv4 } = require('uuid');
const { bucket } = require('../config/firebase.js');
const admin = require('firebase-admin');
const moment = require('moment');
require('dotenv').config();

async function addBookmark(req, res) {
    try {
        const { nama_tanaman, jenis_penyakit } = req.body;

        if (!nama_tanaman) {
            return res.status(400)
                .json({
                    message: "Nama Tanaman tidak ditemukan"
                });
        }
        if (!jenis_penyakit) {
            return res.status(400)
                .json({
                    message: "Penyakit Tanaman tidak ditemukan"
                });
        }
        if (!req.file) {
            return res.status(400)
                .json({
                    message: "Gambar tidak ditemukan"
                });
        }
        // Upload gambar
        const folderName = 'bookmark-image'
        const fileName = `${folderName}/${uuidv4()}.jpg`;
        const file = bucket.file(fileName);
        const blobStream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        });
        blobStream.on('error', (error) => {
            console.error("Error uploading file:", error);
            res.status(500).json({ message: "Failed to upload image" });
        });
        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            // console.log(req.user);
            const newBookmark = {
                // id: predictionRef.id,
                userId: req.user.id,
                nama_tanaman: nama_tanaman,
                jenis_penyakit: jenis_penyakit,
                imageUrl: publicUrl,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };
            // console.log(description);
            // console.log(id);

            const bookmarkRef = await admin.firestore().collection('bookmarks').add(newBookmark);

            res.status(201)
                .json({
                    message: "Succcess",
                    data: {
                        id: bookmarkRef.id,
                        ...newBookmark
                    }
                });
        });
        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error("Error saving prediction and image:", error);
        res.status(500)
            .json({
                message: "Internal Server Error"
            });
    }
}

async function getBookmarkById(req, res) {
    try {
        const bookmarkId = req.params.id;

        const bookmarkRef = admin.firestore().collection('bookmarks').doc(bookmarkId);
        const bookmarkDoc = await bookmarkRef.get();

        // console.log(bookmarkId);

        if (!bookmarkDoc.exists) {
            return res.status(404)
                .json({
                    message: "Bookmark tidak ditemukan!"
                });
        }

        const bookmarkData = bookmarkDoc.data();

        if (bookmarkData.userId !== req.user.id) {
            return res.status(403)
                .json({
                    message: "Akses Ditolak!"
                });
        }

        // Mengubah timestamp Firestore menjadi objek Date
        const timestamp = bookmarkData.timestamp.toDate();
        const formattedTimestamp = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')} ${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`;

        bookmarkData.timestamp = formattedTimestamp;

        res.status(200)
            .json({
                message: "Success",
                data: {
                    id: bookmarkId,
                    ...bookmarkData
                }
            });
    } catch (error) {
        console.error("Error retrieving bookmark:", error);
        res.status(500)
            .json({
                message: "Internal Server Error"
            });
    }
}

async function getAllBookmark(req, res) {
    try {
        const bookmarkRef = admin.firestore().collection('bookmarks').where(
            'userId', '==', req.user.id
        );
        const snapshot = await bookmarkRef.get();

        if (snapshot.empty) {
            return res.status(404)
                .json({
                    message: "BookMark tidak ditemukan!"
                });
        }

        const bookmark = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp.toDate(); 
            const formattedTimestamp = moment(timestamp).utcOffset('+0700').format('YYYY-MM-DD HH:mm:ss'); 
            bookmark.push({
                id: doc.id,
                ...data,
                timestamp: formattedTimestamp 
            });
        });

        res.status(200)
            .json({
                message: "Succecss",
                data: bookmark
            });
    } catch (error) {
        console.error("Error retrieving bookmark bookmark:", error);
        res.status(500)
            .json({
                message: "Internal Server Error"
            });
    }
}

async function deleteBookmarkById(req, res) {
    try {
        const bookmarkId = req.params.id;

        const bookmarkRef = admin.firestore().collection('bookmarks').doc(bookmarkId);
        const bookmarkDoc = await bookmarkRef.get();

        if (!bookmarkDoc.exists) {
            return res.status(404).json({
                message: "Bookmark tidak ditemukan!"
            });
        }

        const bookmarkData = bookmarkDoc.data();

        if (bookmarkData.userId !== req.user.id) {
            return res.status(403).json({
                message: "Akses Ditolak!"
            });
        }

        await bookmarkRef.delete();

        res.status(200).json({
            message: "Bookmark berhasil dihapus"
        });
    } catch (error) {
        console.error("Error deleting bookmark:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

module.exports = {
    addBookmark,
    getBookmarkById,
    getAllBookmark,
    deleteBookmarkById,
};

