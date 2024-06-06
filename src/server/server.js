const express = require('express');
const cors = require('cors');
const authRoute = require('../route/auth-route');
const route = require('../route/route.js');
const app = express()


app.use(cors())
app.use(express.json());

app.use('/auth', authRoute);
app.use('/', route);


const host = 'localHost'
const port = 3000

app.listen(port, () => {
    console.log(`Example app listening on port http://${host}:${port}`)
});