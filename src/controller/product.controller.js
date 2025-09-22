const Product = require("../models/product.model");
const Category = require("../models/category.model");
const slugify = require("slugify");
const { Op } = require("sequelize");
const { logger } = require("../middleware/logger");

// Create product
exports.createProduct = async (req, res, next) => {
  try {
    const productData = req.body;

    // Generate slug if not provided
    if (productData.name && !productData.slug) {
      productData.slug = slugify(productData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
    }

    const product = await Product.create(productData);

    // Include category data in response
    const productWithCategory = await Product.findByPk(product.id, {
      include: [
        { association: "category", attributes: ["id", "name", "slug"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: productWithCategory,
    });
  } catch (error) {
    logger.error("Create product error", {
      error: error.message,
      data: req.body,
      stack: error.stack,
    });
    next(error);
  }
};

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      inStock,
      minPrice,
      maxPrice,
      unitType,
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

    // Category filter
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    // Stock filter
    if (inStock !== undefined) {
      where.inStock = inStock === "true";
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Unit type filter
    if (unitType) {
      where.unitType = unitType;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { shortDescription: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Find all products with pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      paranoid: !includeDeleted,
      include: [
        { association: "category", attributes: ["id", "name", "slug"] },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        products,
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
          categoryId,
          inStock,
          minPrice,
          maxPrice,
          unitType,
          isActive,
          includeInactive,
          includeDeleted,
        },
      },
    });
  } catch (error) {
    logger.error("Get all products error", {
      error: error.message,
      query: req.query,
    });
    next(error);
  }
};

// Get product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    const product = await Product.findOne({
      where: { id },
      paranoid: !includeDeleted,
      include: [
        { association: "category", attributes: ["id", "name", "slug"] },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error("Get product by ID error", {
      error: error.message,
      productId: req.params.id,
    });
    next(error);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Generate slug if name is updated and slug is not provided
    if (updateData.name && !updateData.slug) {
      updateData.slug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
    }

    const product = await Product.findOne({ where: { id } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.update(updateData);

    // Fetch updated product with category
    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { association: "category", attributes: ["id", "name", "slug"] },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    logger.error("Update product error", {
      error: error.message,
      productId: req.params.id,
    });
    next(error);
  }
};

// Delete product (soft delete)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ where: { id } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.destroy();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    logger.error("Delete product error", {
      error: error.message,
      productId: req.params.id,
    });
    next(error);
  }
};

// Restore soft-deleted product
exports.restoreProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id },
      paranoid: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.deletedAt === null) {
      return res.status(400).json({
        success: false,
        message: "Product is not deleted",
      });
    }

    await product.restore();

    return res.status(200).json({
      success: true,
      message: "Product restored successfully",
      data: product,
    });
  } catch (error) {
    logger.error("Restore product error", {
      error: error.message,
      productId: req.params.id,
    });
    next(error);
  }
};
