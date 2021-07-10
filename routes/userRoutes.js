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
router.get("/actives", async (req, resp) => {
  try {
    const response = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/user-report"
    );
    const data = response.data.Items;
    const actualDate = new Date();

    const activeUsers = data
      .filter(
        (user) =>
          !user.account.includes(":") &&
          isActive(user.last_print_date_time, actualDate)
      )
      .map((user) => user.account);
    const activeArray = { users: activeUsers, count: activeUsers.length };
    return resp.send(activeArray);
  } catch (error) {
    resp.status(400).send(error);
  }
});

// GET para obtener quien usa FABLAB y que usa
router.get("/machines-used", async (req, resp) => {
  try {
    const response = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/audit-report"
    );
    const response2 = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/printer-report"
    );
    const impressions = response.data.Items;
    const machineData = response2.data.Items;
    var machines_per_user = {};
    for (let i = 0; i < impressions.length; i++) {
      const job = impressions[i];
      const email = job.email;
      const printer_id = job.printer_id;
      if (Object.keys(machines_per_user).indexOf(email) == -1) {
        machines_per_user[email] = new Array();
      }
      if (Object.values(machines_per_user[email]).indexOf(printer_id) == -1) {
        machines_per_user[email] = [...machines_per_user[email], printer_id];
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

    // Cambiar formato de retorno de usuario: [id_maquina1, id_maquina2, ...] a
    // usuario: {printer_type: tipo_maquina, printer_vid: vid_maquina}
    for (const user in machines_per_user) {
      const ids = machines_per_user[user];
      var infoMachines = new Set();
      ids.forEach((id) => {
        infoMachines.add(JSON.stringify(machines[id]));
      });
      machines_per_user[user] = Array.from(infoMachines).map((obj) =>
        JSON.parse(obj)
      );
    }
    return resp.send(machines_per_user);
  } catch (error) {
    resp.status(400).send(error);
  }
});

// GET para obtener lista de usuarios por grupo
router.get("/group-list", async (req, resp) => {
  try {
    const response = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/org-user-list-report"
    );
    const data = response.data.Items;
    var groups = {};
    for (let i = 0; i < data.length; i++) {
      const maker = data[i];
      const maker_email = maker.account;
      const maker_workgroup = maker.workgroup_name;
      if (maker_workgroup == "") continue;
      if (Object.keys(groups).indexOf(maker_workgroup) == -1) {
        groups[maker_workgroup] = new Array();
      }
      if (Object.values(groups[maker_workgroup]).indexOf(maker_email) == -1) {
        groups[maker_workgroup] = [...groups[maker_workgroup], maker_email];
      }
    }
    return resp.send(groups);
  } catch (error) {
    resp.status(400).send(error);
  }
});

// GET para obtener las impresiones finalizadas de cada usuario
router.get("/impressions", async (req, resp) => {
  try {
    const response = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/audit-report"
    );
    const data = response.data.Items;
    const impressions = data.filter(
      (impression) => impression.status == "Finished"
    );
    var impressions_by_user = {};
    for (let i = 0; i < impressions.length; i++) {
      const impression = impressions[i];
      const maker = impression.email;
      const filename = impression.file_name;
      if (Object.keys(impressions_by_user).indexOf(maker) == -1) {
        impressions_by_user[maker] = new Array();
      }
      if (Object.values(impressions_by_user[maker]).indexOf(filename) == -1) {
        impressions_by_user[maker] = [...impressions_by_user[maker], filename];
      }
    }
    return resp.send(impressions_by_user);
  } catch (error) {
    resp.status(400).send(error);
  }
});

// GET para obtener la cantidad y costo de material usada por los usuarios
router.get("/material-used", async (req, resp) => {
  try {
    const response = await axios.get(
      "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/user-report"
    );
    const data = response.data.Items;
    const material = data.filter((info) => info.material_used_kg > 0);
    var materials_per_user = {};
    for (let i = 0; i < material.length; i++) {
      const information = material[i];
      const maker = information.account;
      const material_used = information.material_used_kg;
      const material_cost = information.material_cost;
      materials_per_user[maker] = {
        material_used: material_used,
        material_cost: material_cost,
      };
    }
    return resp.send(materials_per_user);
  } catch (error) {
    resp.status(400).send(error);
  }
});

module.exports = router;
