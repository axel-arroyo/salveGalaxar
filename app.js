const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// app.use("/users", require("./routes/userRoutes.js"));
app.use("/resources", require("./routes/resourceRoutes.js"));

app.listen(8080, console.log("el servidor esta corriendo en el puerto 8080"));

// Función iterativa para actualizar base de datos cada 5 minuto(s)
var CronJob = require("cron").CronJob;
const routines = require("./routines");

var job = new CronJob("*/5 * * * *", function () {
  routines.updateMachines();
});
job.start();
