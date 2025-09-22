const User = require("../models/user.model");
const AdminProfile = require("../models/adminProfile.model");
const { Op, Model } = require("sequelize");
const { logger } = require("../middleware/logger");

// create admin
exports.createAdmin = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      city,
      bio,
      profilePicture,
    } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      accountType: "admin",
      authProvider: "local",
    });

    // Create admin profile
    const adminProfile = await AdminProfile.create({
      userId: user.id,
      firstName,
      lastName,
      phoneNumber,
      address,
      city,
      bio,
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        user,
        adminProfile,
      },
    });
  } catch (error) {
    logger.error("Create admin error", {
      error: error.message,
      email: req.body.email,
    });
    next(error);
  }
};

// get all admins
exports.getAllAdmins = async (req, res, next) => {
  try {
    const {
      city,
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
      includeDeleted,
    } = req.query;

    const where = { accountType: "admin" };
    const include = [
      {
        model: AdminProfile,
        as: "adminProfile",
      },
    ];

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (city) {
      where.city = city;
    }

    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { "$adminProfile.firstName$": { [Op.iLike]: `%${search}%` } },
        { "$adminProfile.lastName$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const options = {
      where,
      include,
      distinct: true,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      paranoid: includeDeleted !== "true",
    };

    const { count, rows: admins } = await User.findAndCountAll(options);

    return res.status(200).json({
      success: true,
      data: admins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNext: parseInt(page) < Math.ceil(count / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
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
        city,
        includeDeleted,
      },
    });
  } catch (error) {
    logger.error("Get all admins error", {
      error: error.message,
      query: req.query,
    });
    next(error);
  }
};

// get by admin id
exports.getAdminById = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        accountType: "admin",
      },
      include: [
        {
          model: AdminProfile,
          as: "adminProfile",
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    logger.error("Get admin by ID error", {
      error: error.message,
      adminId: req.params.id,
      stack: error.stack,
    });
    next(error);
  }
};

// update admin
exports.updateAdmin = async (req, res, next) => {
  try {
    const updateData = req.body;
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        accountType: "admin",
      },
      include: [
        {
          model: AdminProfile,
          as: "adminProfile",
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== admin.email) {
      const existingUser = await User.findOne({
        where: {
          email: updateData.email,
          accountType: "admin",
          [Op.not]: { id: req.params.id }, // Exclude current admin
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists for another admin",
        });
      }
    }

    // Update user fields
    if (updateData.email || updateData.password) {
      await admin.update(updateData);
    }

    // Update admin profile fields
    if (admin.adminProfile) {
      await admin.adminProfile.update(updateData);
    }

    // Fetch updated admin
    const updatedAdmin = await User.findByPk(req.params.id, {
      include: [
        {
          model: AdminProfile,
          as: "adminProfile",
        },
      ],
      attributes: { exclude: ["password"] },
    });

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    logger.error("Update admin error", {
      error: error.message,
      adminId: req.params.id,
      stack: error.stack,
    });
    next(error);
  }
};

// delete admin (soft delete)
exports.deleteAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        accountType: "admin",
      },
      include: [
        {
          model: AdminProfile,
          as: "adminProfile",
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.adminProfile) {
      await admin.adminProfile.destroy();
    }

    await admin.destroy();

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    logger.error("Delete admin error", {
      error: error.message,
      adminId: req.params.id,
      stack: error.stack,
    });
    next(error);
  }
};

// restore admin (with profile)
exports.restoreAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        accountType: "admin",
      },
      include: [
        {
          model: AdminProfile,
          as: "adminProfile",
          paranoid: false, // Include soft-deleted profiles
        },
      ],
      paranoid: false, // Include soft-deleted users
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Restore admin user
    await admin.restore();

    // Restore admin profile if it exists
    if (admin.adminProfile) {
      await admin.adminProfile.restore();
    }

    return res.status(200).json({
      success: true,
      message: "Admin and profile restored successfully",
    });
  } catch (error) {
    logger.error("Restore admin error", {
      error: error.message,
      adminId: req.params.id,
      stack: error.stack,
    });
    next(error);
  }
};