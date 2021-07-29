"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Type_Machine extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Type_Machine.hasMany(models.Machine, {
        foreignKey: "TypeMachineId",
      });
      Type_Machine.hasMany(models.Capacitacion, {
        foreignKey: "TypeMachineId",
      });
    }
  }
  Type_Machine.init(
    {
      name: DataTypes.STRING,
      vid: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Type_Machine",
    }
  );
  return Type_Machine;
};
