const express = require("express");
const controller = require("../controller/category.controller");
const validate = require("../utils/validations/category.validation");
const { handleValidationErrors } = require("../middleware/validation");
const { authLimiter, apiLimiter } = require("../config/rateLimit");

const router = express.Router();

// Apply rate limiting to all admin routes
router.use(apiLimiter);

router.use(handleValidationErrors);

// create
router.post("/", validate.create, controller.createCategory);

// get all
router.get("/", validate.list, controller.getAllCategories);

// get by id
router.get("/:id", validate.getById, controller.getCategoryById);

// update
router.put("/:id", validate.update, controller.updateCategory);

// delete
router.delete("/:id", validate.delete, controller.deleteCategory);

// restore
router.patch("/:id/restore", validate.restore, controller.restoreCategory);

module.exports = router;
