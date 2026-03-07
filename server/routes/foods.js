const express = require('express');
const FoodItem = require('../models/FoodItem');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/foods — list all (default + user custom)
router.get('/', protect, async (req, res) => {
    try {
        const query = {
            $or: [
                { isDefault: true },
                { userId: req.user._id },
            ],
        };

        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' };
        }

        const foods = await FoodItem.find(query).sort({ name: 1 });
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/foods — create custom food
router.post('/', protect, async (req, res) => {
    try {
        const { name, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g } = req.body;
        const food = await FoodItem.create({
            name,
            caloriesPer100g,
            proteinPer100g,
            carbsPer100g,
            fatPer100g,
            isDefault: false,
            userId: req.user._id,
        });
        res.status(201).json(food);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
