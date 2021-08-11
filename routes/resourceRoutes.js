const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Machine, Type_Machine, Habilitation, Resource } = require("../models");
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
      include: {
        model: Habilitation,
        where: {
          habilitado: true,
        },
      },
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
        const maker_rut = habilitacion.Maker_Rut;
        habilitadosdeMaquina[id_hab] = maker_rut;
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
    const rutMaker = req.query.rut;
    const habilitaciones = await Habilitation.findAll({
      where: {
        Maker_Rut: rutMaker,
        habilitado: true,
      },
      include: Type_Machine,
    });
    const habilitacionesMaker = habilitaciones.map((hab) => [
      hab.id,
      hab.Type_Machine.name,
    ]);
    resp.send(Object.fromEntries(habilitacionesMaker));
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

// Integracion 06-08
router.post("/anadirHabilitacion", async (req, resp) => {
  try {
    const rut_maker = req.body.rut_maker;
    const rut_ayudante = req.body.rut_ayudante;
    // Un ayudante no puede habiltarse a sí mismo
    if (rut_maker == rut_ayudante) return resp.status(400).send("Un ayudante no puede habiltarse a sí mismo");
    // El maker es un estudiante?
    // Maker puede ser [Estudiante, Ayudante, Externo]
    let makerInfo = null;
    routes_maker = ["https://2c32fcf08ad9.up.railway.app/student/rut", "https://2c32fcf08ad9.up.railway.app/assistant/rut", "https://2c32fcf08ad9.up.railway.app/external/rut"];
    for (let i = 0; i < routes_maker.length; i++) {
      const route = routes_maker[i];
      const response = await axios.get(
        route,
        {
          params: {
            rut: rut_maker,
          },
        }
      );
      makerInfo = response.data;
      if (makerInfo.length != 0) break;
    }

    if (makerInfo.length == 0)
      return resp
        .status(400)
        .send(`No existe un maker de rut ${rut_maker}`);

    let ayudanteInfo = await axios.get(
      "https://2c32fcf08ad9.up.railway.app/assistant/rut",
      {
        params: {
          rut: rut_ayudante,
        },
      }
    );
    ayudanteInfo = ayudanteInfo.data;

    let resource = await Resource.findOne({
      where: {
        link: req.body.recurso,
      },
    });
    
    if (ayudanteInfo.length == 0)
      return resp
        .status(400)
        .send(`No existe un ayudante de rut ${rut_ayudante}`);
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
        Maker_Rut: rut_maker,
        TypeMachineId: type_machine.id,
      },
    });
    if (habilitacion) {
      if (habilitacion.habilitado)
        return resp.send(
          `El usuario ${rut_maker} ya se encuentra capacitado para esta máquina`
        );
      await axios.put(
        "http://localhost:8080/resources/actualizarHabilitacion",
        null,
        { params: { id: habilitacion.id } }
      );
      await habilitacion.reload();
      habilitacion.ResourceId = resource.id;
      habilitacion.save();
      return resp.send(`La habilitación para ${rut_maker} ha sido actualizada por el ayudante ${rut_ayudante} para la máquina ${req.body.tipo_maquina}.`);
    }
    habilitacion = await Habilitation.create({
      TypeMachineId: type_machine.id,
      Maker_Rut: rut_maker,
      Ayudante_Rut: rut_ayudante,
      ResourceId: resource.id,
      habilitado: true,
    });
    resp.send(`La habilitación para ${rut_maker} ha sido creada por el ayudante ${rut_ayudante} para la máquina ${req.body.tipo_maquina}.`);
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
    if (!machine)
      return resp.status(400).send(`No existe la máquina de id ${idMachine}`);
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
