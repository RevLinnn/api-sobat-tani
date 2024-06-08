const admin = require('firebase-admin');
require('dotenv').config();

async function getPlantDetails(req, res) {
    const { nama_tanaman, jenis_penyakit } = req.query;

    if (!nama_tanaman || !jenis_penyakit) {
        return res.status(400).json({ message: "Missing query parameters" });
    }

    try {
        const tanamanRef = admin.firestore().collection('plants');
        const querySnapshot = await tanamanRef
            .where('nama_tanaman', '==', nama_tanaman)
            .where('jenis_penyakit', '==', jenis_penyakit)
            .get();

        if (querySnapshot.empty) {
            return res.status(404).json({
                message: "Data Tanaman tidak ditemukan"
            });
        }

        const plantDetails = [];
        querySnapshot.forEach(doc => {
            plantDetails.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return res.status(200).json({
            message: "Success",
            data: plantDetails
        });
    } catch (error) {
        console.error("Error retrieving plant details:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

module.exports = {
    getPlantDetails
};

