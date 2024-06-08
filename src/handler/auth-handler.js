const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
require('dotenv').config();

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

async function register(req, res) {
    const {
        name,
        email,
        password
    } = req.body;

    if (!validateEmail(email)) {
        return res.status(400)
            .json({ message: "Masukkan Email dengan benar" });
    }
    if (!name.trim()) {
        return res.status(400).json({ message: "Masukkan Nama" });
    }
    if (!password) {
        return res.status(400).json({ message: "Masukkan Password" });
    }

    try {
        await admin.auth().getUserByEmail(email);
        // console.log(email);
        return res.status(400)
            .json({
                message: "Email telah terdaftar"
            });
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            try {
                const userRecord = await admin.auth().createUser({
                    email: email,
                    password: password,
                    displayName: name,
                });
                const hashedPassword = await bcrypt.hash(password, 10);
                await admin.firestore().collection('users').doc(userRecord.uid).set({
                    uid: userRecord.uid,
                    name: name,
                    email: email,
                    password: hashedPassword,
                });
                return res.status(200)
                    .json({ message: "Success" });
            } catch (error) {
                console.error("Error creating user: ", error);
                return res.status(500)
                    .json({ message: "Error registering user" });
            }
        } else {
            console.error("Error checking user existence: ", error);
            return res.status(500)
                .json({ message: "Error registering user" });
        }
    }
}

async function login(req, res) {
    const {
        email,
        password
    } = req.body;

    if (!validateEmail(email)) {
        return res.status(400)
            .json({ message: "Masukkan Email dengan benar" });
    }
    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const userId = userRecord.uid;
        const userDoc = await admin.firestore().collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(400).json({ message: "Email tidak terdaftar" });
        }
        const user = userDoc.data();
        if (user.isGoogleLogin) {
            return res.status(400).json({ message: "Silahkan Login menggunakan akun Google" });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: "Password salah" });
        }

        const token = jwt.sign(
            {
                id: userId,
                email: user.email,
                name: user.name,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d',
            }
        );
        user.password = undefined;
        return res.json({
            message: "Success",
            data: user,
            token
        });

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return res.status(400)
                .json({ message: "Email tidak terdaftar" });
        }
        console.error("Error logging in user: ", error);
        return res.status(500)
            .json({ message: "Internal server error" });
    }
}

async function loginWithGoogle(req, res) {
    try {
        const { idToken } = req.body;
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name } = decodedToken;
        const userRef = admin.firestore().collection('users');
        // console.log(userRef);
        const querySnapshot = await userRef.where('email', '==', email).get();
        // console.log(querySnapshot);

        if (querySnapshot.empty) {
            const newUser = {
                name: name,
                email: email,
                isGoogleLogin: true
            };
            await userRef.add(newUser);
            const token = jwt.sign(
                {
                    email: newUser.email,
                    name: newUser.name,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1d',
                }
            );
            return res.json({ user: newUser, token });
        } else {
            const userData = querySnapshot.docs[0].data();
            const token = jwt.sign(
                {
                    email: userData.email,
                    name: userData.name,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1d',
                }
            );
            return res.json({
                message: "Success",
                data: userData,
                token
            });
            // console.log(userData);
        }
    } catch (error) {
        console.error("Error logging in with Google:", error);
        return res.status(500)
            .json({ message: "Internal server error" });
    }
}

async function updateUser(req, res) {
    try {
        const { email } = req.user;
        const { name, password } = req.body;

        if (!name.trim()) {
            return res.status(400).json({ message: "Nama tidak boleh kosong!" });
        }

        const userQuerySnapshot = await admin.firestore().collection('users').where('email', '==', email).get();

        if (userQuerySnapshot.empty) {
            return res.status(400).json({ message: "Pengguna tidak ditemukan" });
        }

        const userId = userQuerySnapshot.docs[0].id;

        let updatedFields = {};
        if (name) {
            updatedFields.name = name;
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updatedFields.password = hashedPassword;
        }

        await admin.firestore().collection('users').doc(userId).update(updatedFields);

        const updatedUserDoc = await admin.firestore().collection('users').doc(userId).get();
        const updatedUserData = updatedUserDoc.data();

        delete updatedUserData.password;

        return res.status(200)
            .json({
                message: "Success",
                data: updatedUserData
            });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function GetDetailUser(req, res) {
    try {
        const { id } = req.user;
        const userDoc = await admin.firestore().collection('users').doc(id).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                message: "Pengguna tidak ditemukan!"
            });
        }

        const userData = userDoc.data();
        delete userData.password;

        return res.status(200).json({
            message: "success",
            data: userData
        });
    } catch (error) {
        console.error("Error getting user profile:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    register,
    login,
    loginWithGoogle,
    updateUser,
    GetDetailUser
};