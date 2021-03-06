"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Habilitation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Habilitation.belongsTo(models.Resource, {
        foreignKey: "ResourceId",
      });
      Habilitation.belongsTo(models.Type_Machine, {
        foreignKey: "TypeMachineId",
      });
    }
  }
  Habilitation.init(
    {
      TypeMachineId: DataTypes.INTEGER,
      Maker_Rut: DataTypes.STRING,
      Ayudante_Rut: DataTypes.STRING,
      ResourceId: DataTypes.INTEGER,
      habilitado: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Habilitation",
    }
  );
  return Habilitation;
};
