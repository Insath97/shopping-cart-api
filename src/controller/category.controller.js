const Category = require("../models/category.model");
const slugify = require("slugify");
const { Op } = require("sequelize");
const { logger } = require("../middleware/logger");

// Create category
exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = req.body;

    const category = await Category.create(categoryData);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    logger.error("Create category error", {
      error: error.message,
      data: req.body,
      stack: error.stack,
    });
    next(error);
  }
};

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      includeInactive = false,
      includeDeleted = false,
      sortBy = "name",
      sortOrder = "ASC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    } else if (!includeInactive) {
      where.isActive = true;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Find all categories with pagination
    const { count, rows: categories } = await Category.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      paranoid: !includeDeleted,
    });

    res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1,
          nextPageUrl:
            parseInt(page) < Math.ceil(count / parseInt(limit))
              ? `${req.protocol}://${req.get("host")}${req.baseUrl}${
                  req.path
                }?page=${parseInt(page) + 1}&limit=${limit}`
              : null,
          prevPageUrl:
            parseInt(page) > 1
              ? `${req.protocol}://${req.get("host")}${req.baseUrl}${
                  req.path
                }?page=${parseInt(page) - 1}&limit=${limit}`
              : null,
        },
        filters: {
          search,
          isActive,
          includeInactive,
          includeDeleted,
        },
      },
    });
  } catch (error) {
    logger.error("Get all categories error", {
      error: error.message,
      query: req.query,
    });
    next(error);
  }
};

// Get category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    const category = await Category.findOne({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error("Get category by ID error", {
      error: error.message,
      categoryId: req.params.id,
    });
    next(error);
  }
};

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.name && !updateData.slug) {
      updateData.slug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
    }

    const category = await Category.findOne({ where: { id } });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await category.update(updateData);

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    logger.error("Update category error", {
      error: error.message,
      categoryId: req.params.id,
    });
    next(error);
  }
};

// Delete category (soft delete)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ where: { id } });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    logger.error("Delete category error", {
      error: error.message,
      categoryId: req.params.id,
    });
    next(error);
  }
};

// Restore soft-deleted category
exports.restoreCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id },
      paranoid: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.deletedAt === null) {
      return res.status(400).json({
        success: false,
        message: "Category is not deleted",
      });
    }

    await category.restore();

    res.status(200).json({
      success: true,
      message: "Category restored successfully",
      data: category,
    });
  } catch (error) {
    logger.error("Restore category error", {
      error: error.message,
      categoryId: req.params.id,
    });
    next(error);
  }
};
