const express = require("express");
const router = express.Router();
const axios = require("axios");

function isActive(date, actualDate) {
  const parsedDate = new Date(date);
  const past_days = (actualDate - parsedDate) / (1000 * 60 * 60 * 24);
  return past_days <= 365;
}

// GET para obtener los usuarios activos de la plataforma
// Se toma como usuario activo a aquel que ha impreso en los últimos 365 días
router.get("/active-users", async (req, resp) => {
  try {
    const response = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/user-report"
    );
    const data = response.data;
    const actualDate = new Date();

    const activeUsers = data.Items.filter(
      (user) =>
        !user.account.includes(":") &&
        isActive(user.last_print_date_time, actualDate)
    ).map((user) => user.account);
    const activeArray = { users: activeUsers, count: activeUsers.length };
    return resp.send(activeArray);
  } catch (error) {
    resp.status(400).send(error);
  }
});

// GET para obtener quien usa FABLAB y que usa
router.get("/user-audit", async (req, resp) => {
  try {
    const response = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/audit-report"
    );
    const response2 = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/printer-report"
    );
    const data = response.data.Items;
    const machineData = response2.data.Items;
    var audit = {};
    for (let i = 0; i < data.length; i++) {
      const job = data[i];
      const email = job.email;
      const printer_id = job.printer_id;
      if (Object.keys(audit).indexOf(email) == -1) {
        audit[email] = new Array();
      }
      if (Object.values(audit[email]).indexOf(printer_id) == -1) {
        audit[email] = [...audit[email], printer_id];
      }
    }

    // Información relevante de máqunas a partir de su id
    var machines = {};
    for (let i = 0; i < machineData.length; i++) {
      const machine = machineData[i];
      machines[machine.printer_id] = {
        printer_type: machine.printer_type,
        printer_vid: machine.printer_vid,
      };
    }

    for (const user in audit) {
      const ids = audit[user];
      var infoMachines = new Set();
      ids.forEach((id) => {
        infoMachines.add(JSON.stringify(machines[id]));
      });
      audit[user] = Array.from(infoMachines).map((obj) => JSON.parse(obj));
    }
    return resp.send(audit);
  } catch (error) {
    resp.status(400).send(error);
  }
});

module.exports = router;
