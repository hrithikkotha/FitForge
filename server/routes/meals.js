const express = require('express');
const MealEntry = require('../models/MealEntry');
const FoodItem = require('../models/FoodItem');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/meals — list user's meals (with optional date filters + pagination)
// Query params: date (single day) OR from+to (range) — mutually exclusive
// page (default 1), limit (default 50, max 100)
router.get('/', protect, async (req, res) => {
    try {
        // Reject ambiguous filter combinations
        if (req.query.date && (req.query.from || req.query.to)) {
            return res.status(400).json({ message: 'Use either "date" or "from"/"to" filters, not both' });
        }

        const query = { userId: req.user._id };

        if (req.query.from || req.query.to) {
            const from = req.query.from ? new Date(req.query.from) : null;
            const to = req.query.to ? new Date(req.query.to) : null;
            if ((from && isNaN(from.getTime())) || (to && isNaN(to.getTime()))) {
                return res.status(400).json({ message: 'Invalid date format for from/to (use ISO 8601)' });
            }
            query.date = {};
            if (from) query.date.$gte = from;
            if (to) query.date.$lte = to;
        }

        if (req.query.date) {
            const d = new Date(req.query.date);
            if (isNaN(d.getTime())) {
                return res.status(400).json({ message: 'Invalid date format (use ISO 8601)' });
            }
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
            query.date = { $gte: start, $lt: end };
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const skip = (page - 1) * limit;

        const [meals, total] = await Promise.all([
            MealEntry.find(query)
                .populate('foodItemId')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
            MealEntry.countDocuments(query),
        ]);

        res.json({ meals, page, limit, total, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/meals — log a new meal
router.post('/', protect, async (req, res) => {
    try {
        const { date, mealType, foodItemId, quantity } = req.body;

        const food = await FoodItem.findById(foodItemId);
        if (!food) return res.status(404).json({ message: 'Food item not found' });

        const gramsPerServing = food.gramsPerServing || 1;
        const totalGrams = quantity * gramsPerServing;
        const multiplier = totalGrams / 100;
        const meal = await MealEntry.create({
            userId: req.user._id,
            date,
            mealType,
            foodItemId,
            foodName: food.name,
            quantity,
            servingUnit: food.servingUnit || 'g',
            calories: Math.round(food.caloriesPer100g * multiplier),
            protein: Math.round(food.proteinPer100g * multiplier * 10) / 10,
            carbs: Math.round(food.carbsPer100g * multiplier * 10) / 10,
            fat: Math.round(food.fatPer100g * multiplier * 10) / 10,
        });

        const populated = await meal.populate('foodItemId');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/meals/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const meal = await MealEntry.findOne({ _id: req.params.id, userId: req.user._id });
        if (!meal) return res.status(404).json({ message: 'Meal not found' });

        if (req.body.foodItemId) {
            const food = await FoodItem.findById(req.body.foodItemId);
            if (!food) return res.status(404).json({ message: 'Food item not found' });

            const qty = req.body.quantity ?? meal.quantity;
            const gramsPerServing = food.gramsPerServing || 1;
            const totalGrams = qty * gramsPerServing;
            const multiplier = totalGrams / 100;
            meal.foodItemId = food._id;
            meal.foodName = food.name;
            meal.quantity = qty;
            meal.servingUnit = food.servingUnit || 'g';
            meal.calories = Math.round(food.caloriesPer100g * multiplier);
            meal.protein = Math.round(food.proteinPer100g * multiplier * 10) / 10;
            meal.carbs = Math.round(food.carbsPer100g * multiplier * 10) / 10;
            meal.fat = Math.round(food.fatPer100g * multiplier * 10) / 10;
        }

        meal.date = req.body.date ?? meal.date;
        meal.mealType = req.body.mealType ?? meal.mealType;

        const updated = await meal.save();
        const populated = await updated.populate('foodItemId');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/meals/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const meal = await MealEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!meal) return res.status(404).json({ message: 'Meal not found' });
        res.json({ message: 'Meal deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
