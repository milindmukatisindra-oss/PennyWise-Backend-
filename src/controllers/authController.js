import UserModel from '../models/UserModel.js';
import ExpenseModel from '../models/ExpenseModel.js';
import IncomeModel from '../models/IncomeModel.js';
import BudgetModel from '../models/BudgetModel.js';
import GoalModel from '../models/GoalModel.js';
import CategoryModel from '../models/CategoryModel.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/token.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, currency = '₹' } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'An account with this email address already exists.', 409);
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await UserModel.create({
      name,
      email,
      password_hash: passwordHash,
      currency,
    });

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    return successResponse(
      res,
      {
        user: newUser,
        token,
      },
      'Account created successfully! Welcome to PennyWise.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user including hashed password
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    // Verify bcrypt hash
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Strip password_hash before sending response
    const { password_hash: _, ...safeUser } = user;

    return successResponse(
      res,
      {
        user: safeUser,
        token,
      },
      'Logged in successfully!'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user profile
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, { user }, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
  return successResponse(res, null, 'Logged out successfully');
};

/**
 * Seed sample data for the logged-in teen to test all features immediately
 */
export const seedDemoData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categories = await CategoryModel.findAll(userId);
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name] = c.id;
    });

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const todayStr = now.toISOString().split('T')[0];

    // Seed Incomes
    await IncomeModel.create({
      userId,
      amount: 6000,
      source: 'Pocket Money',
      description: 'Monthly pocket money from parents',
      incomeDate: `${curYear}-${String(curMonth).padStart(2, '0')}-01`,
    });

    await IncomeModel.create({
      userId,
      amount: 2500,
      source: 'Gift',
      description: 'Birthday gift from Uncle Raj',
      incomeDate: `${curYear}-${String(curMonth).padStart(2, '0')}-05`,
    });

    await IncomeModel.create({
      userId,
      amount: 1500,
      source: 'Part-time work',
      description: 'Tutored neighbor in math',
      incomeDate: `${curYear}-${String(curMonth).padStart(2, '0')}-12`,
    });

    // Seed Expenses
    if (catMap['Food']) {
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Food'],
        amount: 250,
        description: 'Burger & fries with friends',
        expenseDate: todayStr,
        paymentMethod: 'UPI',
      });
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Food'],
        amount: 80,
        description: 'College cafeteria snack',
        expenseDate: todayStr,
        paymentMethod: 'Cash',
      });
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Food'],
        amount: 650,
        description: 'Weekend pizza party',
        expenseDate: `${curYear}-${String(curMonth).padStart(2, '0')}-08`,
        paymentMethod: 'Card',
      });
    }

    if (catMap['Transport']) {
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Transport'],
        amount: 450,
        description: 'Metro smart card monthly recharge',
        expenseDate: `${curYear}-${String(curMonth).padStart(2, '0')}-02`,
        paymentMethod: 'UPI',
      });
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Transport'],
        amount: 120,
        description: 'Auto rickshaw ride to library',
        expenseDate: `${curYear}-${String(curMonth).padStart(2, '0')}-10`,
        paymentMethod: 'Cash',
      });
    }

    if (catMap['Education']) {
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Education'],
        amount: 750,
        description: 'Physics guide & notebooks',
        expenseDate: `${curYear}-${String(curMonth).padStart(2, '0')}-04`,
        paymentMethod: 'UPI',
      });
    }

    if (catMap['Entertainment']) {
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Entertainment'],
        amount: 400,
        description: 'Movie ticket with friends',
        expenseDate: `${curYear}-${String(curMonth).padStart(2, '0')}-07`,
        paymentMethod: 'UPI',
      });
    }

    if (catMap['Gaming']) {
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Gaming'],
        amount: 599,
        description: 'Steam game bundle on discount',
        expenseDate: `${curYear}-${String(curMonth).padStart(2, '0')}-14`,
        paymentMethod: 'Card',
      });
    }

    if (catMap['Shopping']) {
      await ExpenseModel.create({
        userId,
        categoryId: catMap['Shopping'],
        amount: 890,
        description: 'Cool hoodie on sale',
        expenseDate: `${curYear}-${String(curMonth).padStart(2, '0')}-11`,
        paymentMethod: 'UPI',
      });
    }

    // Seed Budgets
    if (catMap['Food']) {
      await BudgetModel.upsert({
        userId,
        categoryId: catMap['Food'],
        amount: 2000,
        month: curMonth,
        year: curYear,
      });
    }
    if (catMap['Transport']) {
      await BudgetModel.upsert({
        userId,
        categoryId: catMap['Transport'],
        amount: 1000,
        month: curMonth,
        year: curYear,
      });
    }
    if (catMap['Entertainment']) {
      await BudgetModel.upsert({
        userId,
        categoryId: catMap['Entertainment'],
        amount: 800,
        month: curMonth,
        year: curYear,
      });
    }

    // Seed Goals
    await GoalModel.create({
      userId,
      title: 'Noise Cancelling Headphones',
      targetAmount: 4000,
      savedAmount: 2600,
      targetDate: `${curYear}-${String(curMonth + 2 > 12 ? curMonth + 2 - 12 : curMonth + 2).padStart(2, '0')}-15`,
      icon: '🎧',
    });

    await GoalModel.create({
      userId,
      title: 'Summer Gaming Chair',
      targetAmount: 7500,
      savedAmount: 1800,
      targetDate: `${curYear + 1}-04-01`,
      icon: '🪑',
    });

    return successResponse(res, null, 'Demo sample data seeded successfully!');
  } catch (error) {
    next(error);
  }
};
