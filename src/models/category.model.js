const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
const slugify = require("slugify");

class Category extends Model {
  static associate(models) {
    this.hasMany(models.Product, {
      foreignKey: "categoryId",
      as: "products",
    });
  }
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please provide a category name",
        },
        len: {
          args: [1, 50],
          msg: "Category name must be between 1 and 50 characters",
        },
      },
      set(value) {
        this.setDataValue("name", value.trim());
        const slug = slugify(value, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });
        if (!this.slug) {
          this.setDataValue("slug", slug);
        }
      },
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: "This slug is already in use" },
      validate: {
        is: { args: /^[a-z0-9-]+$/, msg: "Invalid slug format" },
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Category",
    tableName: "categories",
    timestamps: true,
    paranoid: true,
    defaultScope: {
      where: { isActive: true },
      attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
    },
    hooks: {
      beforeValidate: (category) => {
        if (category.name && !category.slug) {
          category.slug = slugify(category.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g,
          });
        }
        if (category.slug) {
          category.slug = category.slug.toLowerCase();
        }
      },
    },
  }
);

module.exports = Category;
