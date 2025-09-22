const { body, param, query } = require("express-validator");
const { Op } = require("sequelize");
const User = require("../../models/user.model");
const AdminProfile = require("../../models/adminProfile.model");

// Common ID param validation
const idParam = param("id")
  .isInt()
  .withMessage("Invalid ID format")
  .custom(async (value, { req }) => {
    const user = await User.findOne({
      where: {
        id: value,
        accountType: "admin",
      },
      paranoid: req.query.includeDeleted === "true" ? false : true,
    });
    if (!user) throw new Error("Admin not found");
  });

const userIdParam = param("userId")
  .isInt()
  .withMessage("Invalid user ID format")
  .custom(async (value, { req }) => {
    const user = await User.findOne({
      where: {
        id: value,
        accountType: "admin",
      },
      paranoid: req.query.includeDeleted === "true" ? false : true,
    });
    if (!user) throw new Error("Admin user not found");
  });

// Email validation with uniqueness check
const validateEmail = body("email")
  .isEmail()
  .withMessage("Invalid email format")
  .normalizeEmail()
  .isLength({ max: 255 })
  .withMessage("Email must be less than 255 characters")
  .custom(async (value, { req }) => {
    const where = {
      email: value,
      accountType: "admin",
      [Op.not]: { id: req.params?.id || 0 },
    };
    const exists = await User.findOne({ where });
    if (exists) throw new Error("Email already exists for an admin");
  });

// Password validation
const validatePassword = body("password")
  .isLength({ min: 8, max: 128 })
  .withMessage("Password must be 8-128 characters")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage(
    "Password must contain at least one uppercase, one lowercase, one number and one special character"
  );

// Base user validations
const baseUserValidations = [
  validateEmail,
  body("password")
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be 8-128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase, one lowercase, one number and one special character"
    ),

  body("accountType")
    .optional()
    .isIn(["admin"])
    .withMessage("Account type must be 'admin'"),

  body("authProvider")
    .optional()
    .isIn(["local", "google", "facebook", "passkey"])
    .withMessage("Invalid auth provider"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

// Admin profile validations
const adminProfileValidations = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces"),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces"),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Invalid phone number format"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Address must be less than 255 characters"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must be less than 100 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio must be less than 1000 characters"),

  body("profilePicture")
    .optional()
    .trim()
    .isURL() // Add this validation method
    .withMessage("Profile picture must be a valid URL")
    .isLength({ max: 500 }) // Optional: add length validation
    .withMessage("Profile picture URL must be less than 500 characters"),
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

  query("includeProfile")
    .optional()
    .isBoolean()
    .withMessage("includeProfile must be a boolean"),
];

// Bulk operations validation
const bulkOperationsValidation = [
  body("ids")
    .isArray({ min: 1 })
    .withMessage("IDs array is required and cannot be empty"),

  body("ids.*").isInt().withMessage("Each ID must be an integer"),
];

// Status toggle validation
const statusValidation = [
  idParam,
  body("isActive").isBoolean().withMessage("isActive must be a boolean"),
];

// Password update validation
const passwordUpdateValidation = [
  idParam,
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must be 8-128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "New password must contain at least one uppercase, one lowercase, one number and one special character"
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

module.exports = {
  // Create admin with user and profile
  create: [validateEmail, validatePassword, ...adminProfileValidations],

  // Update admin (both user and profile)
  update: [
    idParam,
    validateEmail,
    ...baseUserValidations.map((v) => v.optional()),
    ...adminProfileValidations.map((v) => v.optional()),
  ],

  // Get admin by ID
  getById: [
    idParam,
    query("includeDeleted").optional().isBoolean(),
    query("includeProfile").optional().isBoolean(),
  ],

  // Delete admin
  delete: [idParam],

  // List admins
  list: queryValidations,

  // Toggle admin status
  toggleStatus: [idParam],

  // Restore soft-deleted admin
  restore: [idParam],
};
