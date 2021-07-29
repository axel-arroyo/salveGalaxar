"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Capacitacion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Capacitacion.belongsTo(models.Resource, {
        foreignKey: "ResourceId",
      });
      Capacitacion.belongsTo(models.Ayudante, {
        foreignKey: "AyudanteId",
      });
      Capacitacion.belongsTo(models.Maker, {
        foreignKey: "MakerId",
      });
      Capacitacion.belongsTo(models.Type_Machine, {
        foreignKey: "TypeMachineId",
      });
    }
  }
  Capacitacion.init(
    {
      TypeMachineId: DataTypes.INTEGER,
      MakerId: DataTypes.INTEGER,
      AyudanteId: DataTypes.INTEGER,
      ResourceId: DataTypes.INTEGER,
      habilitado: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Capacitacion",
    }
  );
  return Capacitacion;
};
