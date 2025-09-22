const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");

class User extends Model {
  static associate(models) {
    // Define association with AdminProfile model
    this.hasOne(models.AdminProfile, {
      foreignKey: "userId",
      as: "adminProfile",
    });
  }

  toJSON() {
    const values = { ...super.toJSON() };
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Email already in use",
      },
      validate: {
        isEmail: {
          msg: "Invalid email format",
        },
        notEmpty: {
          msg: "Email is required",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 128],
      },
    },
    accountType: {
      type: DataTypes.ENUM("admin", "customer"),
      allowNull: false,
    },
    authProvider: {
      type: DataTypes.ENUM("local", "google", "facebook", "passkey"),
      defaultValue: "local",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastPasswordChange: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
          user.lastPasswordChange = new Date();
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
          user.lastPasswordChange = new Date();
        }
      },
    },
  }
);

module.exports = User;
