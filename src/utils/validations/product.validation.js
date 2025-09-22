const { body, param, query } = require("express-validator");
const { Op } = require("sequelize");
const Product = require("../../models/product.model");
const Category = require("../../models/category.model");

// Common ID param validation
const idParam = param("id")
  .isInt()
  .withMessage("Invalid product ID format")
  .custom(async (value, { req }) => {
    const product = await Product.findOne({
      where: { id: value },
      paranoid: req.query.includeDeleted === "true" ? false : true,
    });
    if (!product) throw new Error("Product not found");
  });

// Product validations
const productValidations = [
  body("categoryId")
    .isInt()
    .withMessage("Category ID must be an integer")
    .custom(async (value) => {
      const category = await Category.findOne({ 
        where: { id: value, isActive: true } 
      });
      if (!category) throw new Error("Category not found or inactive");
    }),

  body("name")
    .notEmpty()
    .withMessage("Product name is required")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Product name must be between 1 and 200 characters")
    .custom(async (value, { req }) => {
      const where = {
        name: value,
        [Op.not]: { id: req.params?.id || 0 },
      };
      const exists = await Product.findOne({ where });
      if (exists) throw new Error("Product name already exists");
    }),

  body("slug")
    .optional()
    .trim()
    .isLength({ max: 220 })
    .withMessage("Slug must be less than 220 characters")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug can only contain lowercase letters, numbers and hyphens")
    .custom(async (value, { req }) => {
      if (value) {
        const where = {
          slug: value,
          [Op.not]: { id: req.params?.id || 0 },
        };
        const exists = await Product.findOne({ where });
        if (exists) throw new Error("Product slug already exists");
      }
    }),

  body("description")
    .notEmpty()
    .withMessage("Product description is required")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Short description cannot exceed 500 characters"),

  body("price")
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage("Price must be a valid decimal number")
    .custom((value) => {
      if (parseFloat(value) < 0) throw new Error("Price cannot be negative");
      return true;
    }),

  body("quantity")
    .optional()
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage("Quantity must be a valid decimal number")
    .custom((value) => {
      if (parseFloat(value) < 0) throw new Error("Quantity cannot be negative");
      return true;
    }),

  body("unitType")
    .isIn(["kg", "g", "lb", "oz", "piece", "pack", "bunch", "dozen", "liter", "ml"])
    .withMessage("Invalid unit type"),

  body("minQuantity")
    .optional()
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage("Minimum quantity must be a valid decimal number")
    .custom((value, { req }) => {
      if (value !== null && parseFloat(value) < 0) {
        throw new Error("Minimum quantity cannot be negative");
      }
      
      if (value !== null && req.body.maxQuantity !== null && 
          parseFloat(value) > parseFloat(req.body.maxQuantity)) {
        throw new Error("Minimum quantity cannot be greater than maximum quantity");
      }
      return true;
    }),

  body("maxQuantity")
    .optional()
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage("Maximum quantity must be a valid decimal number")
    .custom((value, { req }) => {
      if (value !== null && parseFloat(value) < 0) {
        throw new Error("Maximum quantity cannot be negative");
      }
      
      if (value !== null && req.body.minQuantity !== null && 
          parseFloat(value) < parseFloat(req.body.minQuantity)) {
        throw new Error("Maximum quantity cannot be less than minimum quantity");
      }
      return true;
    }),

  body("manufactureDate")
    .optional()
    .isISO8601()
    .withMessage("Manufacture date must be a valid date")
    .custom((value, { req }) => {
      if (value && req.body.expiryDate && new Date(value) >= new Date(req.body.expiryDate)) {
        throw new Error("Manufacture date must be before expiry date");
      }
      return true;
    }),

  body("expiryDate")
    .optional()
    .isISO8601()
    .withMessage("Expiry date must be a valid date")
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error("Expiry date cannot be in the past");
      }
      return true;
    })
    .custom((value, { req }) => {
      if (value && req.body.manufactureDate && new Date(value) <= new Date(req.body.manufactureDate)) {
        throw new Error("Expiry date must be after manufacture date");
      }
      return true;
    }),

  body("barcode")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Barcode must be less than 100 characters"),

  body("lowStockThreshold")
    .optional()
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage("Low stock threshold must be a valid decimal number")
    .custom((value) => {
      if (value !== null && parseFloat(value) < 0) {
        throw new Error("Low stock threshold cannot be negative");
      }
      return true;
    }),

  body("weight")
    .optional()
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage("Weight must be a valid decimal number")
    .custom((value) => {
      if (value !== null && parseFloat(value) < 0) {
        throw new Error("Weight cannot be negative");
      }
      return true;
    }),

  body("dimensions")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Dimensions must be less than 50 characters")
    .matches(/^(\d+x\d+x\d+|\d+x\d+)$/)
    .withMessage("Dimensions must be in format like '10x5x3' or '10x5'"),

  body("brand")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Brand must be less than 100 characters"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

// Query validations
const queryValidations = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("search")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Search term must be less than 100 characters"),

  query("categoryId")
    .optional()
    .isInt()
    .withMessage("Category ID must be an integer"),

  query("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock filter must be a boolean"),

  query("minPrice")
    .optional()
    .isDecimal()
    .withMessage("Minimum price must be a valid number"),

  query("maxPrice")
    .optional()
    .isDecimal()
    .withMessage("Maximum price must be a valid number"),

  query("unitType")
    .optional()
    .isIn(["kg", "g", "lb", "oz", "piece", "pack", "bunch", "dozen", "liter", "ml"])
    .withMessage("Invalid unit type"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive filter must be a boolean"),

  query("includeInactive")
    .optional()
    .isBoolean()
    .withMessage("includeInactive must be a boolean"),

  query("includeDeleted")
    .optional()
    .isBoolean()
    .withMessage("includeDeleted must be a boolean"),

  query("sortBy")
    .optional()
    .isIn(["name", "price", "quantity", "createdAt", "updatedAt"])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["ASC", "DESC"])
    .withMessage("Sort order must be ASC or DESC"),
];

module.exports = {
  // Create product
  create: productValidations,

  // Update product
  update: [idParam, ...productValidations.map((v) => v.optional())],

  // Get product by ID
  getById: [idParam, query("includeDeleted").optional().isBoolean()],

  // Delete product
  delete: [idParam],

  // List products
  list: queryValidations,

  // Restore product
  restore: [idParam],

  // Toggle product status
  toggleStatus: [
    idParam,
    body("isActive").isBoolean().withMessage("isActive must be a boolean"),
  ],
};