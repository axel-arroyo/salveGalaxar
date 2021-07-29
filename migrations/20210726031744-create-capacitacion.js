"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Capacitacions", {
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
      MakerId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Makers",
          key: "id",
          as: "MakerId",
        },
      },
      AyudanteId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Ayudantes",
          key: "id",
          as: "AyudanteId",
        },
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
    await queryInterface.dropTable("Capacitacions");
  },
};
