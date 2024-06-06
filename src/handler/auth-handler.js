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
            .json({ message: "The email address is improperly formatted." });
    }

    if (!name.trim()) {
        return res.status(400).json({ message: "Name is required" });
    }

    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }

    try {
        await admin.auth().getUserByEmail(email);
        // console.log(email);
        return res.status(400)
            .json({
                message: "Email already registered"
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
            .json({ message: "The email address is improperly formatted." });
    }
    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const userId = userRecord.uid;
        const userDoc = await admin.firestore().collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(400).json({ message: "Email not registered" });
        }
        const user = userDoc.data();
        if (user.isGoogleLogin) {
            return res.status(400).json({ message: "Please login with Google" });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: "Incorrect password" });
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
        return res.json({ user, token });

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return res.status(400)
                .json({ message: "Email not registered" });
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
            return res.json({ user: userData, token });
            // console.log(userData);
        }
    } catch (error) {
        console.error("Error logging in with Google:", error);
        return res.status(500)
            .json({ message: "Internal server error" });
    }
}

async function GetDetailUser(req, res) {
    try {
        const {
            id,
            name,
            email
        } = req.user;

        return res.status(200)
            .json({
                message: "success",
                data: {
                    id: id,
                    name: name,
                    email: email
                }
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
    GetDetailUser
};