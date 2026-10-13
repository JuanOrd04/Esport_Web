'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rosters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        allowNull: false,
        type: Sequelize.STRING
      },
      juego: {
        allowNull: false,
        defaultValue: 'League of Legends',
        type: Sequelize.STRING
      },
      tipo: {
        allowNull: false,
        defaultValue: 'Principal',
        type: Sequelize.ENUM('Principal', 'Academy')
      },
      temporada: {
        allowNull: false,
        type: Sequelize.STRING
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rosters');
  }
};
