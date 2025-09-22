const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
const slugify = require("slugify");

class Product extends Model {
  static associate(models) {
    this.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });
  }
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
      validate: {
        notNull: {
          msg: "Category is required",
        },
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Product name is required",
        },
        len: {
          args: [1, 200],
          msg: "Product name must be between 1 and 200 characters",
        },
      },
      set(value) {
        this.setDataValue("name", value.trim());
        if (!this.slug) {
          const slug = slugify(value, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g,
          });
          this.setDataValue("slug", slug);
        }
      },
    },
    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
      unique: { msg: "This product slug is already in use" },
      validate: {
        is: {
          args: /^[a-z0-9-]+$/,
          msg: "Slug can only contain lowercase letters, numbers, and hyphens",
        },
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Product description is required",
        },
        len: {
          args: [10, 2000],
          msg: "Description must be between 10 and 2000 characters",
        },
      },
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "Short description cannot exceed 500 characters",
        },
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: "Price must be a valid decimal number",
        },
        min: {
          args: [0],
          msg: "Price cannot be negative",
        },
      },
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3), // Supports kg (1.5), pieces (10), etc.
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "Quantity cannot be negative",
        },
      },
    },
    unitType: {
      type: DataTypes.ENUM(
        "kg",
        "g",
        "lb",
        "oz",
        "piece",
        "pack",
        "bunch",
        "dozen",
        "liter",
        "ml"
      ),
      allowNull: false,
      defaultValue: "piece",
      validate: {
        isIn: {
          args: [
            [
              "kg",
              "g",
              "lb",
              "oz",
              "piece",
              "pack",
              "bunch",
              "dozen",
              "liter",
              "ml",
            ],
          ],
          msg: "Invalid unit type",
        },
      },
    },
    minQuantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: "Minimum quantity cannot be negative",
        },
      },
    },
    maxQuantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: "Maximum quantity cannot be negative",
        },
        isValidMax(value) {
          if (
            value !== null &&
            this.minQuantity !== null &&
            value < this.minQuantity
          ) {
            throw new Error(
              "Maximum quantity cannot be less than minimum quantity"
            );
          }
        },
      },
    },
    manufactureDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: "Manufacture date must be a valid date",
        },
        isBeforeExpiry(value) {
          if (value && this.expiryDate && value >= this.expiryDate) {
            throw new Error("Manufacture date must be before expiry date");
          }
        },
      },
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: "Expiry date must be a valid date",
        },
        isAfterManufacture(value) {
          if (value && this.manufactureDate && value <= this.manufactureDate) {
            throw new Error("Expiry date must be after manufacture date");
          }
        },
        notExpired(value) {
          if (value && value < new Date()) {
            throw new Error("Expiry date cannot be in the past");
          }
        },
      },
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    inStock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lowStockThreshold: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      defaultValue: 10,
      validate: {
        min: {
          args: [0],
          msg: "Low stock threshold cannot be negative",
        },
      },
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3), // Weight in kg
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: "Weight cannot be negative",
        },
      },
    },
    dimensions: {
      type: DataTypes.STRING(50), // "10x5x3" or similar format
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "products",
    timestamps: true,
    paranoid: true,
    defaultScope: {
      where: { isActive: true },
      attributes: {
        exclude: ["createdAt", "updatedAt", "deletedAt"],
      },
    },
    hooks: {
      beforeValidate: (product) => {
        if (product.name && !product.slug) {
          product.slug = slugify(product.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g,
          });
        }

        if (product.slug) {
          product.slug = product.slug.toLowerCase();
        }

        if (!product.sku) {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 5);
          product.sku = `SKU-${timestamp}-${random}`.toUpperCase();
        }

        if (product.quantity !== undefined) {
          product.inStock = product.quantity > 0;
        }
      },
      beforeSave: (product) => {
        if (
          product.minQuantity !== null &&
          product.quantity < product.minQuantity
        ) {
          throw new Error("Quantity cannot be less than minimum quantity");
        }
        if (
          product.maxQuantity !== null &&
          product.quantity > product.maxQuantity
        ) {
          throw new Error("Quantity cannot exceed maximum quantity");
        }
      },
    },
  }
);

module.exports = Product;
