const express = require("express");
const router = express.Router();
const axios = require("axios");
const {
  Machine,
  Type_Machine,
  Capacitacion,
  Maker,
  Ayudante,
  Resource,
} = require("../models");
const { response } = require("express");

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
    var machine = await Machine.findOne({
      where: {
        name: req.body.nombre,
      },
    });
    if (machine)
      return resp.status(400).send(`La máquina ${machine.name} ya existe`);
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

router.post("/anadirCapacitacion", async (req, resp) => {
  try {
    // Se asume que los usuarios son válidos
    var maker = await Maker.findOne({
      where: {
        email: req.body.email_maker,
      },
    });
    var ayudante = await Ayudante.findOne({
      where: {
        email: req.body.email_ayudante,
      },
    });
    var resource = await Resource.findOne({
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
    var capacitacion = await Capacitacion.findOne({
      where: {
        MakerId: maker.id,
        TypeMachineId: type_machine.id,
        habilitado: true,
      },
    });
    if (capacitacion)
      return resp
        .status(400)
        .send(
          `El usuario ${req.body.email_maker} ya se encuentra capacitado para esta máquina`
        );
    capacitacion = await Capacitacion.create({
      TypeMachineId: type_machine.id,
      MakerId: maker.id,
      AyudanteId: ayudante.id,
      ResourceId: resource.id,
      habilitado: true,
    });
    resp.send(capacitacion);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.get("/listarMaquinas", async (req, resp) => {
  try {
    const machines = await Machine.findAll({
      include: Type_Machine,
    });
    var machineList = [];
    for (let i = 0; i < machines.length; i++) {
      const machine = machines[i];
      machineName = machine.name;
      typeMachineName = machine.Type_Machine.name;
      machineList.push({ machineName, typeMachineName });
    }
    resp.send(machineList);
  } catch (error) {
    resp.status(400).send(error);
  }
});

router.get("/listarRecursos", async (req, resp) => {
  try {
    const resources = await Resource.findAll();
    const resourceList = resources.map((rec) => rec.link);
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
          model: Capacitacion,
          include: Maker,
        },
      ],
    });
    var habilitacionesPorMaquina = {};
    for (let i = 0; i < habilitaciones.length; i++) {
      // Cada elemento son los tipos de maquina con una lista de los habilitados para cada una de ellas
      const element = habilitaciones[i];
      const typeMachineName = element.name;
      // (element -> Capacitacions -> Maker -> email) corresponde al correo del usuario habilitado.
      // Se obtiene el correo del maker para cada habilitación, por lo que el map obtiene todos los usuarios.
      const habilitados = element.Capacitacions.map((hab) => hab.Maker.email);
      habilitacionesPorMaquina[typeMachineName] = habilitados;
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
          model: Capacitacion,
          include: Type_Machine,
        },
      ],
    });
    const habilitacionesMaker = habilitaciones.Capacitacions.map(
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

module.exports = router;
