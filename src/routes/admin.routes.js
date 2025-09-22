const express = require("express");
const controller = require("../controller/admin.controller");
const validate = require("../utils/validations/admin.validation");
const { handleValidationErrors } = require("../middleware/validation");
const { authLimiter, apiLimiter } = require("../config/rateLimit");

const router = express.Router();

// Apply rate limiting to all admin routes
router.use(apiLimiter);

router.use(handleValidationErrors);

// create admin
router.post("/", validate.create, controller.createAdmin);

// get all
router.get("/", validate.list, controller.getAllAdmins);

// get by id
router.get("/:id", validate.getById, controller.getAdminById);

// update
router.put("/:id", validate.update, controller.updateAdmin);

// delete
router.delete("/:id", validate.delete, controller.deleteAdmin);

// restore
router.patch("/:id/restore", validate.restore, controller.restoreAdmin);

module.exports = router;
