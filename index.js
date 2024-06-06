const express = require('express');
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');
const cors = require('cors')
require('dotenv').config();

// admin.initializeApp({
//     credential: admin.credential.cert({
//         type: "service_account",
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
//         privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//         clientId: process.env.FIREBASE_CLIENT_ID,
//         authUri: process.env.FIREBASE_AUTH_URI,
//         tokenUri: process.env.FIREBASE_TOKEN_URI,
//         authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
//         clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,

//     }),
//     storageBucket: 'sobat-tani-424709.appspot.com'
// });

// const admin = require("firebase-admin");
const { bucket } = require('./src/config/firebase.js');

const app = express()
app.use(express.json());
app.use(cors())
// const bucket = admin.storage().bucket();
const host = 'localHost'
const port = 3000



//Midlewaree
const verifyToken = (req, res, next) => {
    let token = req.header("Authorization");
    if (!token) {
        return res.status(401).send({ message: "Access denied" });
    }

    token = token.replace("Bearer ", "");

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // console.log(verified);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send({ message: "Invalid token" });
    }
};


app.get("/", (req, res) => {
    res.send({ message: "Hello World!" });
});

app.get("/protected", verifyToken, (req, res) => {
    res.send({ message: "You are authorized to access this resource" });
});

// Rute untuk mendaftar pengguna
// app.post("/users/register", async (req, res) => {
//     const { name, email, password } = req.body;

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     try {
//         // Tambahkan data pengguna ke Firestore
//         await admin.firestore().collection('users').add({
//             name: name,
//             email: email,
//             password: hashedPassword
//         });

//         res.status(200).send({ message: "User registered successfully" });
//     } catch (error) {
//         console.error("Error adding user to Firestore: ", error);
//         res.status(500).send({ message: "Error registering user" });
//     }
// });

// app.post("/users/register", async (req, res) => {
//     const { name, email, password } = req.body;

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     try {
//         // Periksa apakah pengguna sudah ada
//         const userSnapshot = await admin.firestore().collection('users').where('email', '==', email).get();

//         // Jika pengguna sudah ada, kirim respons
//         if (!userSnapshot.empty) {
//             return res.status(400).send({ message: "Email already registered" });
//         }

//         // Tambahkan data pengguna ke Firestore
//         await admin.firestore().collection('users').add({
//             name: name,
//             email: email,
//             password: hashedPassword
//         });

//         res.status(200).send({ message: "User registered successfully" });
//     } catch (error) {
//         console.error("Error adding user to Firestore: ", error);
//         res.status(500).send({ message: "Error registering user" });
//     }
// });


app.post("/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Periksa email di Firebase Authentication
        await admin.auth().getUserByEmail(email);
        return res.status(400).send({ message: "Email already registered" });
    } catch (error) {
        // lanjutkan untuk membuat pengguna baru
        if (error.code === 'auth/user-not-found') {
            try {
                // Buat pengguna baru di Firebase Authentication
                const userRecord = await admin.auth().createUser({
                    email: email,
                    password: password,
                    displayName: name,
                });
                // Simpan informasi tambahan tentang pengguna ke Firestore
                const hashedPassword = await bcrypt.hash(password, 10);
                await admin.firestore().collection('users').doc(userRecord.uid).set({
                    uid: userRecord.uid,
                    name: name,
                    email: email,
                    password: hashedPassword,
                });
                res.status(200).send({ message: "Success" });
            } catch (error) {
                console.error("Error creating user: ", error);
                res.status(500).send({ message: "Error registering user" });
            }
        } else {
            console.error("Error checking user existence: ", error);
            res.status(500).send({ message: "Error registering user" });
        }
    }
});


//login

// function validateEmail(email) {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(String(email).toLowerCase());
// }

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    // Validasi format email
    // if (!validateEmail(email)) {
    //     return res.status(400).send({ message: "The email address is improperly formatted." });
    // }
    try {
        // Periksa apakah email sudah terdaftar di Firebase Auth
        const userRecord = await admin.auth().getUserByEmail(email);
        const userId = userRecord.uid;
        // Ambil informasi tambahan dari Firestore
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(400).send({ message: "Email not registered" });
        }
        const user = userDoc.data();
        if (user.isGoogleLogin) {
            return res.status(400).send({ message: "Please login with Google" });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).send({ message: "Invalid password" });
        }
        const token = jwt.sign(
            {
                id: userId,
                email: user.email,
                name: user.name,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: 24 * 60 * 60,
            }
        );
        user.password = undefined;

        const response = { user, token };
        res.send(response);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return res.status(400).send({ message: "Email not registered" });
        }
        console.error("Error logging in user: ", error);
        res.status(500).send({ message: "Internal server error" });
    }
});


//login google
app.post("/auth/login-google", async (req, res) => {
    try {
        const { idToken } = req.body;
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name } = decodedToken;

        // Periksa apakah email pengguna sudah terdaftar di Firestore
        const userRef = admin.firestore().collection('users');
        const querySnapshot = await userRef.where('email', '==', email).get();

        if (querySnapshot.empty) {
            // Jika pengguna belum terdaftar, buat pengguna baru
            const newUser = {
                name: name,
                email: email,
                isGoogleLogin: true
            };
            await userRef.add(newUser);

            // Kirim respons dengan token JWT
            const token = jwt.sign(
                {
                    email: newUser.email,
                    name: newUser.name,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1d', // Token berlaku selama 1 hari
                }
            );
            res.send({ user: newUser, token });
        } else {
            // Jika pengguna sudah terdaftar, kirim respons dengan token JWT
            const userData = querySnapshot.docs[0].data();
            const token = jwt.sign(
                {
                    email: userData.email,
                    name: userData.name,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1d', // Token berlaku selama 1 hari
                }
            );
            res.send({ user: userData, token });
        }
    } catch (error) {
        console.error("Error logging in with Google:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});

app.get("/user", verifyToken, async (req, res) => {
    try {
        // Dapatkan informasi pengguna dari token yang diverifikasi
        const { id, name, email } = req.user;
        // Kirim respons dengan data pengguna
        res.status(200).json({
            message: "success",
            data: {
                id: id,
                name: name,
                email: email
            }
        });
    } catch (error) {
        console.error("Error getting user profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Setup multer untuk menangani file upload
const upload = multer({
    storage: multer.memoryStorage()
});

// Endpoint untuk menyimpan hasil prediksi dan gambar
app.post('/predict', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { prediction } = req.body;

        if (!prediction) {
            return res.status(400).json({ message: "Missing prediction in request body" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Missing image in request" });
        }

        // Upload gambar ke Firebase Storage
        const fileName = `${uuidv4()}.jpg`; // atau format file lainnya sesuai kebutuhan
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
                imageUrl: publicUrl,
                isFavorit: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };

            // console.log(id);

            // Menyimpan hasil prediksi ke Firestore
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
});

//histori
app.get('/predictions', verifyToken, async (req, res) => {
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
});

//bookmark

//bikin endpoint baru berdasarkan id histori untuk mnegubah status bookmarkk
app.patch('/predict/:id', verifyToken, async (req, res) => {
    try {
        const predictionId = req.params.id;
        console.log(predictionId);

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
});

//bookmarkj by id
app.get('/bookmark/:id', verifyToken, async (req, res) => {
    try {
        const bookmarkId = req.params.id;

        const bookmarkRef = admin.firestore().collection('predictions').doc(bookmarkId);
        const bookmarkDoc = await bookmarkRef.get();

        if (!bookmarkDoc.exists) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        const bookmarkData = bookmarkDoc.data();

        // Pastikan bookmark tersebut dimiliki oleh pengguna yang sedang login
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
});



// get all bookmark
app.get('/bookmark', verifyToken, async (req, res) => {
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
});

//dokument dalam dekumen(dokumen predict dalam dokumen user)

app.listen(port, () => {
    console.log(`Example app listening on port http://${host}:${port}`)
});