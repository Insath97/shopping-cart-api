# Shopping Cart API

A RESTful API for managing users, admins, products, and shopping cart functionality.  
Built with **Node.js**, **Express**, and **Sequelize** (PostgreSQL/MySQL).

## Features
- User authentication with **Google, Facebook, and Passkey**
- Admin & User account management
- Admin profile with CRUD operations
- Product categories (Vegetables, Fruits, Cakes, Biscuits, etc.)
- Product browsing with image, name, price, and description
- Shopping cart management:
  - Add items
  - Edit quantities
  - Remove items
  - Dynamic total price calculation
- Pagination, search & filtering
- Soft delete (paranoid) support
- Input validation with **express-validator**
- Centralized logging with **Winston**

## Tech Stack
- Node.js + Express
- Sequelize ORM
- PostgreSQL/MySQL
- JWT Authentication
- Express-validator
- OAuth (Google, Facebook) + Passkey
- Winston logger

## Getting Started
```bash
git clone https://github.com/your-username/shopping-cart-api.git
cd shopping-cart-api
npm install
npm run dev
