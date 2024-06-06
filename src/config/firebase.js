const admin = require("firebase-admin");
require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.cert({
        type: "service_account",
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI,
        tokenUri: process.env.FIREBASE_TOKEN_URI,
        authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    }),
    storageBucket: 'sobat-tani-project-425607.appspot.com'
});

const bucket = admin.storage().bucket();

module.exports = { bucket };

// export FIREBASE_PROJECT_ID="sobat-tani-project-425607"
// export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtj3Ry34iTN184\np3zh7bHDkusnuceCH4hOBYW9xXnNKfCzxEHyGmMtIgyWpkiTDgct9UYh2VYSjsgw\n7u1L/ejhjKqaELfwIAjDIZyWtk5wy1NHIGX3Xw2XsF/GzyQHCGouR0DfoJwwAKE7\nh0oYrVi+Xbss0lFazFjInAxY78iJsVV2wnjaYQ37Hqtclb6xz39w/jgzwl7sps6M\nlUF4mwKUYmzarDpquLDF7NLO1JotP8fOofZZpaLQ1D/sX15LZCi8wiEq/IK+3QVl\nUGbaj//OOt6DSTcpT4DDipwFLC19izkZQaUR1W/yosCgZCDQWn8gKq2ZIcRr+4p0\nSmbhmKeLAgMBAAECggEARrmYiF8Stnrv8JQ/zYkg0UODU/Lem+Xhk3mooEZidfpL\nPdYR0WhzVab0Xkdwd4xV3KKAa7a23mUUquwSAs97IL5DnviFG/LR30JJHxk3KbuR\nOgC3zHANh+y1erxaQAtryWP7yaUXQHBhQ3LD/P5WlWx4o7EouclfvI/qcCt2GrVe\n8rCO95cY97OkiezzKu/t4HU8nkVHo/k4Mu8xnPagURTUfX37e9XZXBhNxue6zOFh\nSBQalHzDCorzgp4V1y2tYpwrDz8JWzWLOd2/lOCrweD/jBuodZPVd3CKZJUwyu7w\nd10gsDb3NXPNPgmQRiAYMXfhase0k0AK4aSs+RDtUQKBgQDZBaUIZVxLZ2KQlSBb\nlKb/oXBd9ugz0NN7nxFFRtq3zSvC6CQz1RywckE5/VlAUzsImLTDxvye5SqlM4eb\n8FXlNZq9QOaWejdMkmLAOH3Kmha9rrINiXHQtuxnY9EBhAnH38eVKk5Yuv7jsIV/\n3X1+taME/JH09+KGAxTg8VlXfQKBgQDMu4GJwylzC41clKOjVxqSojizV88C5MGM\n0y3v7EVBQKywZ7k67Moi2wuIkXjhcoch2rag5oYM9QS1OLPxKTHXUesUR9qF7VmR\nVfoUWMtcuwHHLEBPK4d2Y0FDP1+bPwF1Jt1tvLOOMWs0NU1I7y3E33oJyWTGqegl\nujM3eJj5pwKBgExPE8xz95P78khsZ0hMaLwSA/TGULeHghVBxUzasSVX2z9ZaQFg\nugnA4vaFAtD/cw5+w3Djkwg8BFa6W8CVLV6/Dn3lSC85IiCmiFqWgoSu0bg4qRrh\nbUe6Sj3Ad0lVKCtDoGXuzkWc2usssoRXWT0omP2z4Y6Fav08MCc4NfXxAoGBAJ4x\nOBuJeCqTv4vMslBQypCI1kUFUUhMF53Hw1QCfVS5M3Yu/zofouSh2lyRAxU4WF/5\nTmovFV9Hp3abtLZf/UoB2yHVj20yg6XACDbWkXQ6b1pFv/8shEQe11utySL84RRz\njl7vktIJL2usz+XOIdBgWTzcp4i12lHkeRSgk5s7AoGAMrTAy8kR+1NNibhf7nHt\nTHyd/cgaK41SL0ApcgFfh4WSNdj8IPKsPQZJ99vU0NXcl0Lqih9uRTSotCR3Mxyd\nDpG9yYBD2KhqnMIQWcbE5aVOaR+ppcCYQjW3Jh2fCE2Brf5ZY+dFZTauNzoXlgYd\nUshIAHVfIwyQGROJxKEYixw=\n-----END PRIVATE KEY-----\n"
// export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-k3ue2@sobat-tani-project-425607.iam.gserviceaccount.com"
// export FIREBASE_CLIENT_ID="108399123312199503962"
// export FIREBASE_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
// export FIREBASE_TOKEN_URI="https://oauth2.googleapis.com/token"
// export FIREBASE_AUTH_PROVIDER_X509_CERT_URL="https://www.googleapis.com/oauth2/v1/certs"
// export FIREBASE_CLIENT_X509_CERT_URL="https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-k3ue2%40sobat-tani-project-425607.iam.gserviceaccount.com"
