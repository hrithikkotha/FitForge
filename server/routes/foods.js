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
            const search = String(req.query.search).trim();

            // Validate length
            if (search.length > 100) {
                return res.status(400).json({ message: 'Search term too long (max 100 characters)' });
            }

            // Reject patterns with excessive nesting
            if (/(\(.*\)){3,}/.test(search)) {
                return res.status(400).json({ message: 'Invalid search pattern' });
            }

            // Escape regex metacharacters to prevent ReDoS
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            query.name = { $regex: escaped, $options: 'i' };
        }

        const foods = await FoodItem.find(query)
            .populate('recipeIngredients.ingredientId')
            .sort({ name: 1 });
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Computes aggregate macros (per 100g) for a recipe from its ingredients
async function computeRecipeMacros(recipeIngredients) {
    const ingredients = await FoodItem.find({
        _id: { $in: recipeIngredients.map(r => r.ingredientId) }
    });

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalGrams = 0;

    for (const recipeIng of recipeIngredients) {
        const ing = ingredients.find(i => i._id.toString() === recipeIng.ingredientId.toString());
        if (!ing) continue;

        const gps = ing.gramsPerServing || 1;
        const ingGrams = recipeIng.quantity * gps;
        totalGrams += ingGrams;

        const mult = ingGrams / 100;
        totalCalories += ing.caloriesPer100g * mult;
        totalProtein += ing.proteinPer100g * mult;
        totalCarbs += ing.carbsPer100g * mult;
        totalFat += ing.fatPer100g * mult;
    }

    if (totalGrams === 0) return null;

    return {
        cals: Math.round(totalCalories / totalGrams * 100),
        protein: Math.round((totalProtein / totalGrams * 100) * 10) / 10,
        carbs: Math.round((totalCarbs / totalGrams * 100) * 10) / 10,
        fat: Math.round((totalFat / totalGrams * 100) * 10) / 10,
        totalGrams,
    };
}

// POST /api/foods — create custom food or recipe
router.post('/', protect, async (req, res) => {
    try {
        const { name, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, servingUnit, gramsPerServing, recipeIngredients } = req.body;

        let cals = caloriesPer100g;
        let protein = proteinPer100g || 0;
        let carbs = carbsPer100g || 0;
        let fat = fatPer100g || 0;
        let totalGrams = gramsPerServing || 1;
        const isRecipe = recipeIngredients && recipeIngredients.length > 0;

        if (isRecipe) {
            const macros = await computeRecipeMacros(recipeIngredients);
            if (macros) {
                cals = macros.cals;
                protein = macros.protein;
                carbs = macros.carbs;
                fat = macros.fat;
                totalGrams = macros.totalGrams;
            }
        }

        const food = await FoodItem.create({
            name,
            caloriesPer100g: cals,
            proteinPer100g: protein,
            carbsPer100g: carbs,
            fatPer100g: fat,
            // Recipes are logged by number of servings, not grams, since gramsPerServing is the whole batch weight
            servingUnit: isRecipe ? 'serving' : (servingUnit || 'g'),
            gramsPerServing: totalGrams,
            isDefault: false,
            userId: req.user._id,
            isRecipe,
            recipeIngredients: recipeIngredients || [],
        });

        await food.populate('recipeIngredients.ingredientId');
        res.status(201).json(food);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/foods/:id — edit a custom food or recipe (owner only)
router.put('/:id', protect, async (req, res) => {
    try {
        const food = await FoodItem.findById(req.params.id);
        if (!food) return res.status(404).json({ message: 'Food not found' });
        if (food.isDefault || !food.userId || food.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You cannot edit this food item' });
        }

        const { name, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, servingUnit, gramsPerServing, recipeIngredients } = req.body;

        food.name = name ?? food.name;

        if (recipeIngredients && recipeIngredients.length > 0) {
            const macros = await computeRecipeMacros(recipeIngredients);
            if (macros) {
                food.caloriesPer100g = macros.cals;
                food.proteinPer100g = macros.protein;
                food.carbsPer100g = macros.carbs;
                food.fatPer100g = macros.fat;
                food.gramsPerServing = macros.totalGrams;
            }
            food.isRecipe = true;
            food.recipeIngredients = recipeIngredients;
            // Recipes are logged by number of servings, not grams
            food.servingUnit = 'serving';
        } else {
            food.caloriesPer100g = caloriesPer100g ?? food.caloriesPer100g;
            food.proteinPer100g = proteinPer100g ?? food.proteinPer100g;
            food.carbsPer100g = carbsPer100g ?? food.carbsPer100g;
            food.fatPer100g = fatPer100g ?? food.fatPer100g;
            food.servingUnit = servingUnit ?? food.servingUnit;
            food.gramsPerServing = gramsPerServing ?? food.gramsPerServing;
        }

        await food.save();
        await food.populate('recipeIngredients.ingredientId');
        res.json(food);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/foods/:id — delete a custom food or recipe (owner only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const food = await FoodItem.findById(req.params.id);
        if (!food) return res.status(404).json({ message: 'Food not found' });
        if (food.isDefault || !food.userId || food.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You cannot delete this food item' });
        }

        await food.deleteOne();
        res.json({ message: 'Food deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
