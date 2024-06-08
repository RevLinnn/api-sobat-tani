const { v4: uuidv4 } = require('uuid');
const { bucket } = require('../config/firebase.js');
const admin = require('firebase-admin');
const moment = require('moment');
require('dotenv').config();

async function addStatus(req, res) {
    try {
        const {
            nama_tanaman,
            jenis_penyakit
        } = req.body;

        if (!nama_tanaman) {
            return res.status(400)
                .json({
                    message: "Masukkan Nama Tanaman!"
                });
        }

        if (!jenis_penyakit) {
            return res.status(400)
                .json({
                    message: "Masukkan Jenis Penyakit!"
                }
                );
        }

        if (!req.file) {
            return res.status(400)
                .json({
                    message: "Masukkan gambar Tanaman!"
                });
        }

        // Upload gambar ke Firebase Storage
        const folderName = 'status-image'
        const fileName = `${folderName}/${uuidv4()}.jpg`;
        const file = bucket.file(fileName);

        const blobStream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        });

        blobStream.on('error', (error) => {
            console.error("Error uploading file:", error);
            res.status(500)
                .json({
                    message: "Gagal mengunggah gambar"
                });
        });

        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            // console.log(req.user);
            const newStatus = {
                // id: predictionRef.id,
                userId: req.user.id,
                nama_tanaman: nama_tanaman,
                jenis_penyakit: jenis_penyakit,
                imageUrl: publicUrl,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };

            const statusRef = await admin.firestore().collection('status').add(newStatus);

            res.status(201)
                .json({
                    message: "Success",
                    data: {
                        id: statusRef.id,
                        ...newStatus
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

//get all status
async function getAllStatus(req, res) {
    try {
        const statusRef = admin.firestore().collection('status');
        const snapshot = await statusRef.get();

        if (snapshot.empty) {
            return res.status(404)
                .json({
                    message: "status tidak ditemukan!"
                });
        }

        const status = [];
        snapshot.forEach(doc => {
            const statusData = doc.data();
            const responseData = {
                id: doc.id,
                userId: statusData.userId,
                imageUrl: statusData.imageUrl,
                nama_tanaman: statusData.nama_tanaman,
                jenis_penyakit: statusData.jenis_penyakit,
                timestamp: moment(statusData.timestamp.toDate()).format('YYYY-MM-DD HH:mm:ss')
            };
            status.push(responseData);
        });

        res.status(200)
            .json({
                message: "Succecss",
                data: status
            });
    } catch (error) {
        console.error("Error retrieving favorited bookmark:", error);
        res.status(500)
            .json({
                message: "Internal Server Error"
            });
    }
}

//get status by id
async function getStatusById(req, res) {
    try {
        const statusId = req.params.id;
        const statusRef = admin.firestore().collection('status').doc(statusId);
        const statusDoc = await statusRef.get();

        if (!statusDoc.exists) {
            return res.status(404)
                .json({
                    message: "status tidak ditemukan!"
                });
        }

        const statusData = statusDoc.data();

        const responseData = {
            id: statusId,
            userId: statusData.userId,
            nama_tanaman: statusData.nama_tanaman,
            jenis_penyakit: statusData.jenis_penyakit,
            imageUrl: statusData.imageUrl,
            timestamp: moment(statusData.timestamp.toDate()).format('YYYY-MM-DD HH:mm:ss')
        };

        res.status(200)
            .json({
                message: "Success",
                data: responseData
            });
    } catch (error) {
        console.error("Error retrieving status:", error);
        res.status(500)
            .json({
                message: "Internal Server Error"
            });
    }
}

//delete status
async function deleteStatus(req, res) {
    try {
        const statusId = req.params.id;
        const statusRef = admin.firestore().collection('status').doc(statusId);
        const statusDoc = await statusRef.get();

        if (!statusDoc.exists) {
            return res.status(404).json({ message: "Status not found" });
        }

        const statusData = statusDoc.data();
        const imageUrl = statusData.imageUrl;
        const fileName = imageUrl.split(`${bucket.name}/`)[1];
        const file = bucket.file(fileName);

        await file.delete();
        await statusRef.delete();

        res.status(200)
            .json({
                message: "Success"
            });
    } catch (error) {
        console.error("Error deleting status and image:", error);
        res.status(500)
            .json({
                message: "Internal Server Error"
            });
    }
}

module.exports = {
    addStatus,
    getAllStatus,
    getStatusById,
    deleteStatus,
};

