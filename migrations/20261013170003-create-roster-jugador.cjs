'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roster_jugador', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_roster: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'rosters',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      id_jugador: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'jugadores',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      rol_en_roster: {
        allowNull: false,
        type: Sequelize.ENUM('Titular', 'Suplente')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('roster_jugador');
  }
};
