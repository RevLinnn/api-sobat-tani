// const express = require('express');
// const admin = require("firebase-admin");
// const admin = require("../config/firebase.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");

require('dotenv').config();

//Register Penguna
async function register(req, res) {
    const { name, email, password } = req.body;
    try {
        await admin.auth().getUserByEmail(email);
        // console.log(email);
        return res.status(400).send({message: "Email already registered" });
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            try {
                // buat user baru
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
}


async function login(req, res) {
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
}


//login google
async function LoginWithGoogle(req, res) {
    try {
        const { idToken } = req.body;
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name } = decodedToken;

        // Periksa apakah email pengguna sudah terdaftar di Firestore
        const userRef = admin.firestore().collection('users');

        // console.log(userRef);

        const querySnapshot = await userRef.where('email', '==', email).get();

        // console.log(querySnapshot);

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

            // console.log(userData);
        }
    } catch (error) {
        console.error("Error logging in with Google:", error);
        res.status(500).send({ message: "Internal server error" });
    }
}

async function GetDetailUser(req, res) {
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
}


module.exports = {
    register,
    login,
    LoginWithGoogle,
    GetDetailUser
};