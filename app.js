const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/reports", require("./routes/reportRoutes.js"));

app.listen(8080, console.log("el servidor esta corriendo en el puerto 8080"));