const { v4: uuidv4 } = require('uuid');
const { bucket } = require('../config/firebase.js');
// const { admin } = require('../config/firebase.js');
const admin = require('firebase-admin');
require('dotenv').config();





async function addPredict(req, res) {
    try {
        const { prediction, description } = req.body;

        if (!prediction) {
            return res.status(400).json({ message: "Missing prediction in request body" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Missing image in request" });
        }

        // Upload gambar
        const folderName = 'prediction-image'
        // const fileName = `${folderName}/${uuidv4()}.jpg`;
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
            const newPrediction = {
                // id: predictionRef.id,
                userId: req.user.id,
                prediction: prediction,
                description: description,
                imageUrl: publicUrl,
                isFavorit: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };
            // console.log(description);
            // console.log(id);

            // Menyimpan hasil
            const predictionRef = await admin.firestore().collection('predictions').add(newPrediction);

            res.status(201).json({
                message: "Prediction and image saved successfully",
                data: {
                    id: predictionRef.id,
                    ...newPrediction
                }
            });
        });

        blobStream.end(req.file.buffer);

    } catch (error) {
        console.error("Error saving prediction and image:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


async function getPredictionByIdUser(req, res) {
    try {
        const predictionsRef = admin.firestore().collection('predictions').where('userId', '==', req.user.id);
        const snapshot = await predictionsRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "No predictions found for this user" });
        }

        const predictions = [];
        snapshot.forEach(doc => {
            predictions.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json({
            message: "Success",
            data: predictions
        });
    } catch (error) {
        console.error("Error retrieving predictions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


async function addBookmark(req, res) {
    try {
        const predictionId = req.params.id;
        // console.log(predictionId);

        // Ambil dokumen prediksi dari Firestore
        const predictionRef = admin.firestore().collection('predictions').doc(predictionId);
        const predictionDoc = await predictionRef.get();

        if (!predictionDoc.exists) {
            return res.status(404).json({ message: "Prediction not found" });
        }

        const predictionData = predictionDoc.data();

        // Cek apakah prediksi tersebut milik pengguna yang sedang login
        if (predictionData.userId !== req.user.id) {
            // console.log(userId);
            return res.status(403).json({ message: "anda saha" });
        }

        // Ubah nilai isFavorit menjadi sebaliknya
        const newIsFavorit = !predictionData.isFavorit;

        // Update dokumen di Firestore
        await predictionRef.update({
            isFavorit: newIsFavorit
        });

        res.status(200).json({
            message: "Prediction favorit status updated successfully",
            data: {
                id: predictionId,
                isFavorit: newIsFavorit
            }
        });
    } catch (error) {
        console.error("Error updating prediction favorit status:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

async function getBookmarkById(req, res) {
    try {
        const bookmarkId = req.params.id;

        const bookmarkRef = admin.firestore().collection('predictions').doc(bookmarkId);
        const bookmarkDoc = await bookmarkRef.get();

        if (!bookmarkDoc.exists) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        const bookmarkData = bookmarkDoc.data();

        // Check if the bookmark isFavorit is true
        if (!bookmarkData.isFavorit) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        // Ensure the bookmark belongs to the currently logged-in user
        if (bookmarkData.userId !== req.user.id) {
            return res.status(403).json({ message: "You do not have permission to access this bookmark" });
        }

        res.status(200).json({
            message: "Bookmark retrieved successfully",
            data: {
                id: bookmarkId,
                ...bookmarkData
            }
        });
    } catch (error) {
        console.error("Error retrieving bookmark:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


// async function getBookmarkById (req, res) {
//     try {
//         const bookmarkId = req.params.id;

//         const bookmarkRef = admin.firestore().collection('predictions').doc(bookmarkId);
//         // const bookmarkRef = admin.firestore().collection('predictions').where('isFavorit', '==', true);

//         console.log(bookmarkRef);
//         // const bookmarkDoc = await bookmarkRef.where('isFavorit', '==', true).get();
//         const bookmarkDoc = await bookmarkRef.get();

//         if (!bookmarkDoc.exists) {
//             return res.status(404).json({ message: "Bookmark not found" });
//         }

//         const bookmarkData = bookmarkDoc.data();

//         // Pastikan bookmark tersebut dimiliki oleh pengguna yang sedang login
//         if (bookmarkData.userId !== req.user.id) {
//             return res.status(403).json({ message: "You do not have permission to access this bookmark" });
//         }

//         res.status(200).json({
//             message: "Bookmark retrieved successfully",
//             data: {
//                 id: bookmarkId,
//                 ...bookmarkData
//             }
//         });
//     } catch (error) {
//         console.error("Error retrieving bookmark:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }


async function getAllBookmark(req, res) {
    try {
        const predictionsRef = admin.firestore().collection('predictions').where('userId', '==', req.user.id);
        const snapshot = await predictionsRef.where('isFavorit', '==', true).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "BookMark found" });
        }

        const bookmark = [];
        snapshot.forEach(doc => {
            bookmark.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json({
            message: "Succecss",
            data: bookmark
        });
    } catch (error) {
        console.error("Error retrieving favorited predictions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

async function addMiniklopedia(req, res) {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Masukkan Judul" });
        }

        if (!description) {
            return res.status(400).json({ message: "Masukkan deskripsi" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Missing image in request" });
        }

        // Upload gambar ke Firebase Storage
        const folderName = 'miniklopedia'
        const fileName = `${folderName}/${uuidv4()}.jpg`; // atau format file lainnya sesuai kebutuhan
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
            const newMiniklopedia = {
                // id: predictionRef.id,
                userId: req.user.id,
                title: title,
                description: description,
                imageUrl: publicUrl,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };

            // Menyimpan hasil prediksi ke Firestore
            const miniklopediaRef = await admin.firestore().collection('miniklopedias').add(newMiniklopedia);

            res.status(201).json({
                message: "miniklopedia and image saved successfully",
                data: {
                    id: miniklopediaRef.id,
                    ...newMiniklopedia
                }
            });
        });

        blobStream.end(req.file.buffer);

    } catch (error) {
        console.error("Error saving prediction and image:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


//get all miniklopedia
async function getAllMiniklopedia(req, res) {
    try {
        const miniklopediaRef = admin.firestore().collection('miniklopedias');
        const snapshot = await miniklopediaRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "Miniklopedia Not found" });
        }

        const miniklopedia = [];
        snapshot.forEach(doc => {
            miniklopedia.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json({
            message: "Succecss",
            data: miniklopedia
        });
    } catch (error) {
        console.error("Error retrieving favorited predictions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//get miniklopedia by id
async function getMiniklopediaById(req, res) {
    try {
        const miniklopediaId = req.params.id;

        const miniklopediaRef = admin.firestore().collection('miniklopedias').doc(miniklopediaId);
        const miniklopediaDoc = await miniklopediaRef.get();

        if (!miniklopediaDoc.exists) {
            return res.status(404).json({ message: "miniklopedia not found" });
        }

        const miniklopediaData = miniklopediaDoc.data();

        res.status(200).json({
            message: "miniklopedia retrieved successfully",
            data: {
                id: miniklopediaId,
                ...miniklopediaData
            }
        });
    } catch (error) {
        console.error("Error retrieving miniklopedia:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//delete miniklopedia
async function deleteMiniklopedia(req, res) {
    try {
        const miniklopediaId = req.params.id;

        const miniklopediaRef = admin.firestore().collection('miniklopedias').doc(miniklopediaId);
        const miniklopediaDoc = await miniklopediaRef.get();

        if (!miniklopediaDoc.exists) {
            return res.status(404).json({ message: "miniklopedia not found" });
        }

        const miniklopediaData = miniklopediaDoc.data();

        // Delete the image from Firebase Storage
        const imageUrl = miniklopediaData.imageUrl;
        const fileName = imageUrl.split(`${bucket.name}/`)[1];
        const file = bucket.file(fileName);

        await file.delete();

        // Delete the document from Firestore
        await miniklopediaRef.delete();

        res.status(200).json({ message: "miniklopedia and image deleted successfully" });
    } catch (error) {
        console.error("Error deleting miniklopedia and image:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    addPredict,
    getPredictionByIdUser,
    addBookmark,
    getBookmarkById,
    getAllBookmark,
    addMiniklopedia,
    getAllMiniklopedia,
    getMiniklopediaById,
    deleteMiniklopedia
};

