'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jugadores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nickname: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      nombre_real: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pais: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rol: {
        allowNull: false,
        type: Sequelize.ENUM('Top', 'Jungle', 'Mid', 'ADC', 'Support')
      },
      estado: {
        allowNull: false,
        defaultValue: 'activo',
        type: Sequelize.ENUM('activo', 'inactivo')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jugadores');
  }
};
