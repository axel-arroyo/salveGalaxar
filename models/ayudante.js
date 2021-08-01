"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Ayudante extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Ayudante.hasMany(models.Habilitation, {
        foreignKey: "AyudanteId",
      });
    }
  }
  Ayudante.init(
    {
      email: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Ayudante",
    }
  );
  return Ayudante;
};
