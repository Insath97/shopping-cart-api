const { body, param, query } = require("express-validator");
const { Op } = require("sequelize");
const Category = require("../../models/category.model");

// Common ID param validation
const idParam = param("id")
  .isInt()
  .withMessage("Invalid ID format")
  .custom(async (value, { req }) => {
    const category = await Category.findOne({
      where: { id: value },
      paranoid: req.query.includeDeleted === "true" ? false : true,
    });
    if (!category) throw new Error("Category not found");
  });

// Category validations
const categoryValidations = [
  body("name")
    .notEmpty()
    .withMessage("Category name is required")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Category name must be between 1 and 50 characters")
    .custom(async (value, { req }) => {
      const where = {
        name: value,
        [Op.not]: { id: req.params?.id || 0 },
      };
      const exists = await Category.findOne({ where });
      if (exists) throw new Error("Category name already exists");
    }),

  body("slug")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Slug must be less than 100 characters")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug can only contain lowercase letters, numbers and hyphens")
    .custom(async (value, { req }) => {
      if (value) {
        const where = {
          slug: value,
          [Op.not]: { id: req.params?.id || 0 },
        };
        const exists = await Category.findOne({ where });
        if (exists) throw new Error("Slug already exists");
      }
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be less than 1000 characters"),

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
];

module.exports = {
  // Create category
  create: categoryValidations,

  // Update category
  update: [idParam, ...categoryValidations.map((v) => v.optional())],

  // Get category by ID
  getById: [idParam, query("includeDeleted").optional().isBoolean()],

  // Delete category
  delete: [idParam],

  // List categories
  list: queryValidations,

  // Restore category
  restore: [idParam],

  // Toggle category status
  toggleStatus: [
    idParam,
    body("isActive").isBoolean().withMessage("isActive must be a boolean"),
  ],
};
