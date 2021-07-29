"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Machine extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Machine.belongsTo(models.Type_Machine, {
        foreignKey: "TypeMachineId",
      });
    }
  }
  Machine.init(
    {
      name: DataTypes.STRING,
      location: DataTypes.STRING,
      TypeMachineId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Machine",
    }
  );
  return Machine;
};
