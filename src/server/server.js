const express = require('express');
const cors = require('cors');
const authRoute = require('../route/auth-route');
const bookmarkRoute = require('../route/bookmark-route.js');
const statusRoute = require('../route/status-route.js');
const plantRoute = require('../route/plant-route.js');
const app = express()


app.use(cors())
app.use(express.json());

app.use('/auth', authRoute);
app.use('/bookmark', bookmarkRoute);
app.use('/status', statusRoute);
app.use('/plant', plantRoute);

const host = '0.0.0.0'
const port = 8080

app.get('/', (req, res) => {
    res.send('Hello World!')
  })

app.listen(port, () => {
    console.log(`Example app listening on port http://${host}:${port}`)
});