const express = require("express");
const router = express.Router();
const axios = require("axios");
const {
  Machine,
  Type_Machine,
  Habilitation,
  Maker,
  Ayudante,
  Resource,
} = require("../models");
const { response } = require("express");

router.get("/listarMaquinas", async (req, resp) => {
  try {
    const machines = await Machine.findAll({
      include: Type_Machine,
    });
    const typeMachines = await Type_Machine.findAll();
    let machineList = {};
    // Agregar a machineList los tipos de maquina, inicialmente sin máquinas
    for (let i = 0; i < typeMachines.length; i++) {
      const typeMachine = typeMachines[i];
      const typeMachineName = typeMachine.name;
      machineList[typeMachineName] = new Object();
    }
    // Agregar las maquinas a machineList
    for (let i = 0; i < machines.length; i++) {
      const machine = machines[i];
      const machineName = machine.name;
      const machineId = machine.id;
      const typeMachineName = machine.Type_Machine.name;
      machineList[typeMachineName][machineId] = machineName;
    }
    resp.send(machineList);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.get("/listarRecursos", async (req, resp) => {
  try {
    const resources = await Resource.findAll();
    let resourceList = {};
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const resourceId = resource.id;
      const resourceLink = resource.link;
      resourceList[resourceId] = resourceLink;
    }
    resp.send(resourceList);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.get("/listarHabilitacion", async (req, resp) => {
  try {
    const habilitaciones = await Type_Machine.findAll({
      include: [
        {
          model: Habilitation,
          include: Maker,
        },
      ],
    });
    let habilitacionesPorMaquina = {};
    for (let i = 0; i < habilitaciones.length; i++) {
      // Cada elemento son los tipos de maquina con una lista de los habilitados para cada una de ellas
      const element = habilitaciones[i];
      const typeMachineName = element.name;
      // (element -> Habilitations -> Maker -> email) corresponde al correo del usuario habilitado.
      // Se obtiene el correo del maker para cada habilitación, por lo que el map obtiene todos los usuarios.
      let habilitadosdeMaquina = {};
      for (let i = 0; i < element.Habilitations.length; i++) {
        const habilitacion = element.Habilitations[i];
        const id_hab = habilitacion.id;
        const maker_email = habilitacion.Maker.email;
        habilitadosdeMaquina[id_hab] = maker_email;
      }
      habilitacionesPorMaquina[typeMachineName] = habilitadosdeMaquina;
    }
    resp.send(habilitacionesPorMaquina);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.get("/buscarHabilitacion", async (req, resp) => {
  try {
    const emailMaker = req.query.emailMaker;
    const habilitaciones = await Maker.findOne({
      where: {
        email: emailMaker,
      },
      include: [
        {
          model: Habilitation,
          include: Type_Machine,
        },
      ],
    });
    const habilitacionesMaker = habilitaciones.Habilitations.map(
      (hab) => hab.Type_Machine.name
    );
    resp.send(habilitacionesMaker);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.get("/listarHabilitacionPorTipoMaquina", async (req, resp) => {
  try {
    const typeMachineName = req.query.name;
    const habilitacionesPorTipoMaquina = await axios.get(
      "http://localhost:8080/resources/listarHabilitacion"
    );
    const habilitacionesTipoMaquina =
      habilitacionesPorTipoMaquina.data[typeMachineName];
    resp.send(habilitacionesTipoMaquina);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.post("/anadirHabilitacion", async (req, resp) => {
  try {
    // Se asume que los usuarios son válidos
    let maker = await Maker.findOne({
      where: {
        email: req.body.email_maker,
      },
    });
    let ayudante = await Ayudante.findOne({
      where: {
        email: req.body.email_ayudante,
      },
    });
    let resource = await Resource.findOne({
      where: {
        link: req.body.recurso,
      },
    });
    if (!maker)
      maker = await Maker.create({
        email: req.body.email_maker,
      });
    if (!ayudante)
      ayudante = await Ayudante.create({
        email: req.body.email_ayudante,
      });
    if (!resource)
      resource = await Resource.create({
        link: req.body.recurso,
      });
    const type_machine = await Type_Machine.findOne({
      where: {
        name: req.body.tipo_maquina,
      },
    });
    if (!type_machine)
      return resp
        .status(400)
        .send(`El tipo de máquina ${req.body.tipo_maquina} no existe`);
    let habilitacion = await Habilitation.findOne({
      where: {
        MakerId: maker.id,
        TypeMachineId: type_machine.id,
        habilitado: true,
      },
    });
    if (habilitacion)
      return resp
        .status(400)
        .send(
          `El usuario ${req.body.email_maker} ya se encuentra capacitado para esta máquina`
        );
    habilitacion = await Habilitation.create({
      TypeMachineId: type_machine.id,
      MakerId: maker.id,
      AyudanteId: ayudante.id,
      ResourceId: resource.id,
      habilitado: true,
    });
    resp.send(habilitacion);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.post("/anadirMaquina", async (req, resp) => {
  try {
    // (nombre, ubicación, tipo_maquina)
    const type_machine = await Type_Machine.findOne({
      where: {
        name: req.body.tipo_maquina,
      },
    });
    if (!type_machine)
      return resp.status(400).send("El tipo de máquina no existe");
    let machine = await Machine.findOne({
      where: {
        name: req.body.nombre,
        TypeMachineId: type_machine.id,
      },
    });
    if (machine)
      return resp
        .status(400)
        .send(
          `La máquina ${machine.name} de tipo ${type_machine.name} ya existe`
        );
    machine = await Machine.create({
      name: req.body.nombre,
      location: req.body.ubicacion,
      TypeMachineId: type_machine.id,
    });
    resp.send(machine);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.put("/actualizarHabilitacion", async (req, resp) => {
  try {
    const idHabilitation = req.query.id;
    const habilitacion = await Habilitation.findOne({
      where: { id: idHabilitation },
    });
    habilitacion.habilitado = !habilitacion.habilitado;
    await habilitacion.save();
    resp.send(`Habilitación cambiada a ${habilitacion.habilitado}`);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.put("/actualizarRecurso", async (req, resp) => {
  try {
    const idRecurso = req.query.id;
    const newLink = req.query.link;
    const recurso = await Resource.findOne({ where: { id: idRecurso } });
    recurso.link = newLink;
    await recurso.save();
    resp.send(`Recurso cambiado a ${recurso.link}`);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.delete("/eliminarMaquina", async (req, resp) => {
  try {
    const idMachine = req.query.id;
    const machine = await Machine.findOne({ where: { id: idMachine } });
    if (!machine) return resp.send(`No existe la máquina de id ${idMachine}`);
    await machine.destroy();
    resp.send("Máquina borrada exitosamente");
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.post("/anadirTipoMaquina", async (req, resp) => {
  try {
    // (vid, nombre)
    const type_exist = await Type_Machine.findOne({
      where: {
        vid: req.body.vid,
      },
    });
    if (type_exist)
      return resp
        .status(400)
        .send(`El tipo de máquina ${type_exist.name} ya existe`);
    const type_machine = await Type_Machine.create({
      vid: req.body.vid,
      name: req.body.nombre,
    });
    resp.send(type_machine);
  } catch (error) {
    resp.status(400).send(error);
  }
});

module.exports = router;
