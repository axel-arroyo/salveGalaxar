const axios = require("axios");

async function updateMachines() {
  console.log("Actualizada la BD");
  const machineAPI = await axios.get(
    "https://c840cfx2we.execute-api.us-east-1.amazonaws.com/dev/isw/printer-report"
  );
  const machinesJSON = machineAPI.data.Items;
  var addedMachines = await axios.get(
    "http://localhost:8080/resources/listarMaquinas"
  );
  var addedMachines = addedMachines.data;
  for (let i = 0; i < machinesJSON.length; i++) {
    const machineInfo = machinesJSON[i];
    const machineName = machineInfo.printer_name;
    const machineTypeName = machineInfo.printer_type;
    const machineTypeVID = machineInfo.printer_vid;
    if (Object.keys(addedMachines).indexOf(machineTypeName) == -1) {
      // No existe el tipo de maquina en la base de datos
      // Agregar tipo de maquina maquina
      await axios.post("http://localhost:8080/resources/anadirTipoMaquina", {
        vid: machineTypeVID,
        nombre: machineTypeName,
      });
      addedMachines[machineTypeName] = new Array();
    }
    if (
      Object.values(addedMachines[machineTypeName]).indexOf(machineName) == -1
    ) {
      // No existe la maquina en la base de datos
      // Agregar maquina
      await axios.post("http://localhost:8080/resources/anadirMaquina", {
        nombre: machineName,
        tipo_maquina: machineTypeName,
      });
    }
  }
}

module.exports = { updateMachines };
