"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Habilitations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      TypeMachineId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Type_Machines",
          key: "id",
          as: "TypeMachineId",
        },
      },
      Maker_Rut: {
        type: Sequelize.STRING
      },
      Ayudante_Rut: {
        type: Sequelize.STRING
      },
      ResourceId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Resources",
          key: "id",
          as: "ResourceId",
        },
      },
      habilitado: {
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Habilitations");
  },
};
