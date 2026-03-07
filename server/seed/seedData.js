const Exercise = require('../models/Exercise');
const FoodItem = require('../models/FoodItem');

const defaultExercises = [
    // Chest
    { name: 'Barbell Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Incline Dumbbell Press', category: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps'] },
    { name: 'Decline Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps'] },
    { name: 'Cable Flyes', category: 'strength', muscleGroups: ['chest'] },
    { name: 'Dumbbell Flyes', category: 'strength', muscleGroups: ['chest'] },
    { name: 'Push-Ups', category: 'bodyweight', muscleGroups: ['chest', 'triceps', 'shoulders'] },

    // Back
    { name: 'Deadlift', category: 'strength', muscleGroups: ['lower_back', 'hamstrings', 'glutes', 'traps'] },
    { name: 'Barbell Row', category: 'strength', muscleGroups: ['lats', 'upper_back', 'biceps'] },
    { name: 'Pull-Ups', category: 'bodyweight', muscleGroups: ['lats', 'biceps', 'upper_back'] },
    { name: 'Lat Pulldown', category: 'strength', muscleGroups: ['lats', 'biceps'] },
    { name: 'Seated Cable Row', category: 'strength', muscleGroups: ['upper_back', 'lats', 'biceps'] },
    { name: 'T-Bar Row', category: 'strength', muscleGroups: ['upper_back', 'lats'] },
    { name: 'Face Pulls', category: 'strength', muscleGroups: ['upper_back', 'shoulders'] },

    // Shoulders
    { name: 'Overhead Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Lateral Raises', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Front Raises', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Reverse Flyes', category: 'strength', muscleGroups: ['shoulders', 'upper_back'] },
    { name: 'Arnold Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Upright Row', category: 'strength', muscleGroups: ['shoulders', 'traps'] },

    // Arms
    { name: 'Barbell Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Dumbbell Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Hammer Curl', category: 'strength', muscleGroups: ['biceps', 'forearms'] },
    { name: 'Preacher Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Tricep Pushdown', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Skull Crushers', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Overhead Tricep Extension', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Dips', category: 'bodyweight', muscleGroups: ['triceps', 'chest', 'shoulders'] },
    { name: 'Wrist Curls', category: 'strength', muscleGroups: ['forearms'] },

    // Legs
    { name: 'Barbell Squat', category: 'strength', muscleGroups: ['quads', 'glutes', 'hamstrings'] },
    { name: 'Leg Press', category: 'strength', muscleGroups: ['quads', 'glutes'] },
    { name: 'Leg Extension', category: 'strength', muscleGroups: ['quads'] },
    { name: 'Leg Curl', category: 'strength', muscleGroups: ['hamstrings'] },
    { name: 'Romanian Deadlift', category: 'strength', muscleGroups: ['hamstrings', 'glutes', 'lower_back'] },
    { name: 'Bulgarian Split Squat', category: 'strength', muscleGroups: ['quads', 'glutes'] },
    { name: 'Lunges', category: 'strength', muscleGroups: ['quads', 'glutes', 'hamstrings'] },
    { name: 'Calf Raises', category: 'strength', muscleGroups: ['calves'] },
    { name: 'Hip Thrust', category: 'strength', muscleGroups: ['glutes', 'hamstrings'] },

    // Core
    { name: 'Plank', category: 'bodyweight', muscleGroups: ['abs', 'obliques'] },
    { name: 'Crunches', category: 'bodyweight', muscleGroups: ['abs'] },
    { name: 'Leg Raises', category: 'bodyweight', muscleGroups: ['abs'] },
    { name: 'Russian Twist', category: 'bodyweight', muscleGroups: ['obliques', 'abs'] },
    { name: 'Cable Woodchop', category: 'strength', muscleGroups: ['obliques', 'abs'] },
    { name: 'Ab Wheel Rollout', category: 'bodyweight', muscleGroups: ['abs', 'obliques'] },

    // Traps
    { name: 'Barbell Shrugs', category: 'strength', muscleGroups: ['traps'] },
    { name: 'Dumbbell Shrugs', category: 'strength', muscleGroups: ['traps'] },

    // Cardio
    { name: 'Running', category: 'cardio', muscleGroups: ['quads', 'calves', 'hamstrings'] },
    { name: 'Cycling', category: 'cardio', muscleGroups: ['quads', 'calves'] },
    { name: 'Swimming', category: 'cardio', muscleGroups: ['lats', 'shoulders', 'chest'] },
    { name: 'Rowing Machine', category: 'cardio', muscleGroups: ['lats', 'upper_back', 'biceps'] },
    { name: 'Elliptical', category: 'cardio', muscleGroups: ['quads', 'glutes'] },
    { name: 'Jump Rope', category: 'cardio', muscleGroups: ['calves', 'quads'] },
    { name: 'Stair Climber', category: 'cardio', muscleGroups: ['quads', 'glutes', 'calves'] },
    { name: 'Walking', category: 'cardio', muscleGroups: ['quads', 'calves'] },
];

const defaultFoods = [
    // Proteins
    { name: 'Chicken Breast (cooked)', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
    { name: 'Salmon (cooked)', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
    { name: 'Eggs (whole)', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
    { name: 'Egg Whites', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
    { name: 'Greek Yogurt', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
    { name: 'Cottage Cheese', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },
    { name: 'Tuna (canned)', caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1 },
    { name: 'Turkey Breast', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1 },
    { name: 'Tofu', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8 },
    { name: 'Paneer', caloriesPer100g: 265, proteinPer100g: 18, carbsPer100g: 1.2, fatPer100g: 21 },
    { name: 'Whey Protein Powder', caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 10, fatPer100g: 5 },

    // Carbs
    { name: 'White Rice (cooked)', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
    { name: 'Brown Rice (cooked)', caloriesPer100g: 112, proteinPer100g: 2.3, carbsPer100g: 24, fatPer100g: 0.8 },
    { name: 'Oats (dry)', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7 },
    { name: 'Whole Wheat Bread', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4 },
    { name: 'Pasta (cooked)', caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1 },
    { name: 'Sweet Potato (cooked)', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
    { name: 'Potato (cooked)', caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1 },
    { name: 'Quinoa (cooked)', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },
    { name: 'Chapati / Roti', caloriesPer100g: 297, proteinPer100g: 9, carbsPer100g: 50, fatPer100g: 7 },

    // Fruits
    { name: 'Banana', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
    { name: 'Apple', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
    { name: 'Orange', caloriesPer100g: 43, proteinPer100g: 0.9, carbsPer100g: 9, fatPer100g: 0.1 },
    { name: 'Blueberries', caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3 },
    { name: 'Mango', caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4 },

    // Vegetables
    { name: 'Broccoli', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
    { name: 'Spinach (raw)', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
    { name: 'Chicken Salad', caloriesPer100g: 110, proteinPer100g: 14, carbsPer100g: 3, fatPer100g: 5 },

    // Fats & Nuts
    { name: 'Almonds', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
    { name: 'Peanut Butter', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
    { name: 'Olive Oil', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
    { name: 'Avocado', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15 },

    // Dairy
    { name: 'Whole Milk', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3 },
    { name: 'Skim Milk', caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1 },
    { name: 'Cheddar Cheese', caloriesPer100g: 403, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33 },

    // Snacks / Misc
    { name: 'Dark Chocolate (70%)', caloriesPer100g: 598, proteinPer100g: 7.8, carbsPer100g: 46, fatPer100g: 43 },
    { name: 'Granola Bar', caloriesPer100g: 471, proteinPer100g: 10, carbsPer100g: 64, fatPer100g: 20 },
    { name: 'Protein Bar', caloriesPer100g: 350, proteinPer100g: 30, carbsPer100g: 35, fatPer100g: 10 },
];

const seedDatabase = async () => {
    try {
        const exerciseCount = await Exercise.countDocuments({ isDefault: true });
        if (exerciseCount === 0) {
            const exercises = defaultExercises.map(e => ({ ...e, isDefault: true, userId: null }));
            await Exercise.insertMany(exercises);
            console.log(`Seeded ${exercises.length} default exercises`);
        } else {
            console.log(`Exercises already seeded (${exerciseCount} found)`);
        }

        const foodCount = await FoodItem.countDocuments({ isDefault: true });
        if (foodCount === 0) {
            const foods = defaultFoods.map(f => ({ ...f, isDefault: true, userId: null }));
            await FoodItem.insertMany(foods);
            console.log(`Seeded ${foods.length} default food items`);
        } else {
            console.log(`Food items already seeded (${foodCount} found)`);
        }
    } catch (error) {
        console.error('Error seeding database:', error.message);
    }
};

module.exports = seedDatabase;
