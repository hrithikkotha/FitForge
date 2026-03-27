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
    // ── PROTEINS — Animal ─────────────────────────────────────────────────────
    { name: 'Chicken Breast (cooked)', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Chicken Thigh (cooked)', caloriesPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Turkey Breast', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Salmon (cooked)', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Sardines (canned in water)', caloriesPer100g: 150, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 5, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Tuna (canned in water)', caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Mackerel (cooked)', caloriesPer100g: 205, proteinPer100g: 19, carbsPer100g: 0, fatPer100g: 14, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Shrimp (cooked)', caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Beef (lean, cooked)', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Beef Mince (lean, cooked)', caloriesPer100g: 215, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 12, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Pork Tenderloin (cooked)', caloriesPer100g: 143, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 3.5, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Mutton (cooked)', caloriesPer100g: 294, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 21, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Eggs (whole)', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, servingUnit: 'piece', gramsPerServing: 50 },
    { name: 'Egg Whites', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, servingUnit: 'piece', gramsPerServing: 33 },
    { name: 'Hard Boiled Egg', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, servingUnit: 'piece', gramsPerServing: 50 },

    // ── PROTEINS — Dairy ──────────────────────────────────────────────────────
    { name: 'Greek Yogurt (plain)', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4, servingUnit: 'cup', gramsPerServing: 245 },
    { name: 'Cottage Cheese', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3, servingUnit: 'cup', gramsPerServing: 226 },
    { name: 'Cheddar Cheese', caloriesPer100g: 403, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Mozzarella Cheese', caloriesPer100g: 280, proteinPer100g: 22, carbsPer100g: 2.2, fatPer100g: 17, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Whole Milk', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Skim Milk', caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Paneer', caloriesPer100g: 265, proteinPer100g: 18, carbsPer100g: 1.2, fatPer100g: 21, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Curd / Yogurt', caloriesPer100g: 60, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3, servingUnit: 'cup', gramsPerServing: 245 },
    { name: 'Buttermilk / Chaas', caloriesPer100g: 40, proteinPer100g: 3.3, carbsPer100g: 4.8, fatPer100g: 0.9, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Kefir', caloriesPer100g: 60, proteinPer100g: 3.4, carbsPer100g: 4.5, fatPer100g: 3.5, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Whey Protein Powder', caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 10, fatPer100g: 5, servingUnit: 'scoop', gramsPerServing: 30 },
    { name: 'Casein Protein Powder', caloriesPer100g: 375, proteinPer100g: 75, carbsPer100g: 10, fatPer100g: 4, servingUnit: 'scoop', gramsPerServing: 30 },
    { name: 'Plant Protein Powder (Pea+Rice)', caloriesPer100g: 380, proteinPer100g: 70, carbsPer100g: 15, fatPer100g: 5, servingUnit: 'scoop', gramsPerServing: 30 },

    // ── PROTEINS — Indian Dishes ──────────────────────────────────────────────
    { name: 'Tandoori Chicken', caloriesPer100g: 148, proteinPer100g: 25, carbsPer100g: 2, fatPer100g: 4.5, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Chicken Tikka', caloriesPer100g: 148, proteinPer100g: 24, carbsPer100g: 3, fatPer100g: 4, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Chicken Curry', caloriesPer100g: 175, proteinPer100g: 16, carbsPer100g: 5, fatPer100g: 10, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Egg Curry', caloriesPer100g: 148, proteinPer100g: 9, carbsPer100g: 4, fatPer100g: 11, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Fish Curry', caloriesPer100g: 148, proteinPer100g: 15, carbsPer100g: 4, fatPer100g: 8, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Palak Paneer', caloriesPer100g: 168, proteinPer100g: 9, carbsPer100g: 8, fatPer100g: 12, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Paneer Bhurji', caloriesPer100g: 220, proteinPer100g: 14, carbsPer100g: 5, fatPer100g: 16, servingUnit: 'g', gramsPerServing: 1 },

    // ── PROTEINS — Plant ──────────────────────────────────────────────────────
    { name: 'Tofu (firm)', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Tempeh', caloriesPer100g: 192, proteinPer100g: 20, carbsPer100g: 7.6, fatPer100g: 11, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Edamame (shelled)', caloriesPer100g: 121, proteinPer100g: 12, carbsPer100g: 8.9, fatPer100g: 5.2, servingUnit: 'cup', gramsPerServing: 155 },
    { name: 'Soya Chunks (dry)', caloriesPer100g: 345, proteinPer100g: 52, carbsPer100g: 33, fatPer100g: 0.5, servingUnit: 'g', gramsPerServing: 1 },

    // ── LEGUMES / DALS ────────────────────────────────────────────────────────
    { name: 'Toor Dal (cooked)', caloriesPer100g: 128, proteinPer100g: 7.5, carbsPer100g: 21, fatPer100g: 0.6, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Moong Dal (cooked)', caloriesPer100g: 106, proteinPer100g: 7, carbsPer100g: 18, fatPer100g: 0.4, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Masoor Dal (cooked)', caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Chana Dal (cooked)', caloriesPer100g: 164, proteinPer100g: 9, carbsPer100g: 27, fatPer100g: 2.6, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Urad Dal (cooked)', caloriesPer100g: 127, proteinPer100g: 9, carbsPer100g: 22, fatPer100g: 0.6, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Rajma / Kidney Beans (cooked)', caloriesPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 22.8, fatPer100g: 0.5, servingUnit: 'cup', gramsPerServing: 180 },
    { name: 'Chole / Chickpeas (cooked)', caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27, fatPer100g: 2.6, servingUnit: 'cup', gramsPerServing: 164 },
    { name: 'Black Beans (cooked)', caloriesPer100g: 132, proteinPer100g: 8.9, carbsPer100g: 23.7, fatPer100g: 0.5, servingUnit: 'cup', gramsPerServing: 172 },
    { name: 'Lentils (cooked)', caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, servingUnit: 'cup', gramsPerServing: 198 },
    { name: 'Moong Sprouts', caloriesPer100g: 31, proteinPer100g: 3, carbsPer100g: 4.2, fatPer100g: 0.2, servingUnit: 'cup', gramsPerServing: 104 },

    // ── GRAINS / CARBS ────────────────────────────────────────────────────────
    { name: 'White Rice (cooked)', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Brown Rice (cooked)', caloriesPer100g: 112, proteinPer100g: 2.3, carbsPer100g: 24, fatPer100g: 0.8, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Basmati Rice (cooked)', caloriesPer100g: 121, proteinPer100g: 3.5, carbsPer100g: 26, fatPer100g: 0.4, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Oats (dry)', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Quinoa (cooked)', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Whole Wheat Bread', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, servingUnit: 'slice', gramsPerServing: 30 },
    { name: 'Multigrain Bread', caloriesPer100g: 265, proteinPer100g: 10, carbsPer100g: 44, fatPer100g: 4, servingUnit: 'slice', gramsPerServing: 30 },
    { name: 'Pasta (cooked)', caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Sweet Potato (cooked)', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Potato (cooked)', caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1, servingUnit: 'g', gramsPerServing: 1 },

    // Indian Breads / Breakfast
    { name: 'Chapati / Roti', caloriesPer100g: 297, proteinPer100g: 9, carbsPer100g: 50, fatPer100g: 7, servingUnit: 'piece', gramsPerServing: 40 },
    { name: 'Paratha', caloriesPer100g: 326, proteinPer100g: 7, carbsPer100g: 42, fatPer100g: 15, servingUnit: 'piece', gramsPerServing: 60 },
    { name: 'Aloo Paratha', caloriesPer100g: 280, proteinPer100g: 6, carbsPer100g: 40, fatPer100g: 12, servingUnit: 'piece', gramsPerServing: 80 },
    { name: 'Dosa (plain)', caloriesPer100g: 168, proteinPer100g: 4, carbsPer100g: 27, fatPer100g: 5, servingUnit: 'piece', gramsPerServing: 80 },
    { name: 'Masala Dosa', caloriesPer100g: 200, proteinPer100g: 4.5, carbsPer100g: 30, fatPer100g: 7, servingUnit: 'piece', gramsPerServing: 120 },
    { name: 'Idli', caloriesPer100g: 130, proteinPer100g: 4, carbsPer100g: 24, fatPer100g: 1, servingUnit: 'piece', gramsPerServing: 40 },
    { name: 'Sambar', caloriesPer100g: 55, proteinPer100g: 3, carbsPer100g: 8, fatPer100g: 1.5, servingUnit: 'cup', gramsPerServing: 240 },
    { name: 'Poha (cooked)', caloriesPer100g: 130, proteinPer100g: 2.5, carbsPer100g: 23, fatPer100g: 3, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Upma (cooked)', caloriesPer100g: 104, proteinPer100g: 3, carbsPer100g: 16, fatPer100g: 3, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Khichdi (cooked)', caloriesPer100g: 110, proteinPer100g: 4.5, carbsPer100g: 19, fatPer100g: 2.5, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Pongal', caloriesPer100g: 130, proteinPer100g: 4, carbsPer100g: 20, fatPer100g: 4, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Uttapam', caloriesPer100g: 160, proteinPer100g: 4.5, carbsPer100g: 25, fatPer100g: 5, servingUnit: 'piece', gramsPerServing: 100 },
    { name: 'Biryani (chicken)', caloriesPer100g: 200, proteinPer100g: 12, carbsPer100g: 22, fatPer100g: 7, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Curd Rice', caloriesPer100g: 110, proteinPer100g: 3.5, carbsPer100g: 18, fatPer100g: 3, servingUnit: 'cup', gramsPerServing: 200 },

    // ── VEGETABLES ────────────────────────────────────────────────────────────
    { name: 'Broccoli', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, servingUnit: 'cup', gramsPerServing: 91 },
    { name: 'Spinach (raw)', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, servingUnit: 'cup', gramsPerServing: 30 },
    { name: 'Spinach (cooked)', caloriesPer100g: 41, proteinPer100g: 5.4, carbsPer100g: 6.8, fatPer100g: 0.5, servingUnit: 'cup', gramsPerServing: 180 },
    { name: 'Kale (raw)', caloriesPer100g: 49, proteinPer100g: 4.3, carbsPer100g: 9, fatPer100g: 0.9, servingUnit: 'cup', gramsPerServing: 67 },
    { name: 'Cauliflower', caloriesPer100g: 25, proteinPer100g: 1.9, carbsPer100g: 5, fatPer100g: 0.3, servingUnit: 'cup', gramsPerServing: 107 },
    { name: 'Bell Pepper', caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, servingUnit: 'piece', gramsPerServing: 120 },
    { name: 'Tomato', caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, servingUnit: 'piece', gramsPerServing: 120 },
    { name: 'Cucumber', caloriesPer100g: 16, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1, servingUnit: 'piece', gramsPerServing: 200 },
    { name: 'Carrot', caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2, servingUnit: 'piece', gramsPerServing: 80 },
    { name: 'Onion', caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1, servingUnit: 'piece', gramsPerServing: 110 },
    { name: 'Garlic', caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33, fatPer100g: 0.5, servingUnit: 'piece', gramsPerServing: 3 },
    { name: 'Peas (green, cooked)', caloriesPer100g: 81, proteinPer100g: 5.4, carbsPer100g: 14, fatPer100g: 0.4, servingUnit: 'cup', gramsPerServing: 160 },
    { name: 'Corn (cooked)', caloriesPer100g: 96, proteinPer100g: 3.4, carbsPer100g: 21, fatPer100g: 1.5, servingUnit: 'cup', gramsPerServing: 154 },
    { name: 'Mushrooms (sauteed)', caloriesPer100g: 28, proteinPer100g: 2.2, carbsPer100g: 4.3, fatPer100g: 0.4, servingUnit: 'cup', gramsPerServing: 156 },
    { name: 'Asparagus (cooked)', caloriesPer100g: 22, proteinPer100g: 2.4, carbsPer100g: 4.1, fatPer100g: 0.2, servingUnit: 'cup', gramsPerServing: 180 },
    { name: 'Beetroot', caloriesPer100g: 43, proteinPer100g: 1.6, carbsPer100g: 10, fatPer100g: 0.2, servingUnit: 'piece', gramsPerServing: 100 },
    { name: 'Bitter Gourd / Karela', caloriesPer100g: 17, proteinPer100g: 1, carbsPer100g: 3.7, fatPer100g: 0.2, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Bottle Gourd / Lauki', caloriesPer100g: 14, proteinPer100g: 0.6, carbsPer100g: 3.4, fatPer100g: 0.02, servingUnit: 'g', gramsPerServing: 1 },

    // ── FRUITS ────────────────────────────────────────────────────────────────
    { name: 'Banana', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, servingUnit: 'piece', gramsPerServing: 120 },
    { name: 'Apple', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, servingUnit: 'piece', gramsPerServing: 180 },
    { name: 'Orange', caloriesPer100g: 43, proteinPer100g: 0.9, carbsPer100g: 9, fatPer100g: 0.1, servingUnit: 'piece', gramsPerServing: 130 },
    { name: 'Mango', caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4, servingUnit: 'piece', gramsPerServing: 200 },
    { name: 'Papaya', caloriesPer100g: 43, proteinPer100g: 0.5, carbsPer100g: 11, fatPer100g: 0.3, servingUnit: 'cup', gramsPerServing: 145 },
    { name: 'Pineapple', caloriesPer100g: 50, proteinPer100g: 0.5, carbsPer100g: 13, fatPer100g: 0.1, servingUnit: 'cup', gramsPerServing: 165 },
    { name: 'Blueberries', caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3, servingUnit: 'cup', gramsPerServing: 148 },
    { name: 'Strawberries', caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3, servingUnit: 'cup', gramsPerServing: 152 },
    { name: 'Grapes', caloriesPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2, servingUnit: 'cup', gramsPerServing: 151 },
    { name: 'Watermelon', caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 7.5, fatPer100g: 0.2, servingUnit: 'cup', gramsPerServing: 152 },
    { name: 'Pomegranate', caloriesPer100g: 83, proteinPer100g: 1.7, carbsPer100g: 19, fatPer100g: 1.2, servingUnit: 'piece', gramsPerServing: 282 },
    { name: 'Guava', caloriesPer100g: 68, proteinPer100g: 2.6, carbsPer100g: 14, fatPer100g: 1, servingUnit: 'piece', gramsPerServing: 100 },
    { name: 'Kiwi', caloriesPer100g: 61, proteinPer100g: 1.1, carbsPer100g: 15, fatPer100g: 0.5, servingUnit: 'piece', gramsPerServing: 76 },
    { name: 'Pear', caloriesPer100g: 57, proteinPer100g: 0.4, carbsPer100g: 15, fatPer100g: 0.1, servingUnit: 'piece', gramsPerServing: 180 },

    // ── FATS & NUTS ───────────────────────────────────────────────────────────
    { name: 'Avocado', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, servingUnit: 'piece', gramsPerServing: 150 },
    { name: 'Almonds', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Walnuts', caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Cashews', caloriesPer100g: 553, proteinPer100g: 18, carbsPer100g: 30, fatPer100g: 44, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Peanuts', caloriesPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Pistachios', caloriesPer100g: 562, proteinPer100g: 20, carbsPer100g: 28, fatPer100g: 45, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Brazil Nuts', caloriesPer100g: 659, proteinPer100g: 14, carbsPer100g: 12, fatPer100g: 67, servingUnit: 'piece', gramsPerServing: 5 },
    { name: 'Peanut Butter', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, servingUnit: 'tbsp', gramsPerServing: 16 },
    { name: 'Almond Butter', caloriesPer100g: 614, proteinPer100g: 21, carbsPer100g: 19, fatPer100g: 56, servingUnit: 'tbsp', gramsPerServing: 16 },
    { name: 'Flax Seeds', caloriesPer100g: 534, proteinPer100g: 18, carbsPer100g: 29, fatPer100g: 42, servingUnit: 'tbsp', gramsPerServing: 10 },
    { name: 'Chia Seeds', caloriesPer100g: 486, proteinPer100g: 17, carbsPer100g: 42, fatPer100g: 31, servingUnit: 'tbsp', gramsPerServing: 12 },
    { name: 'Hemp Seeds', caloriesPer100g: 553, proteinPer100g: 32, carbsPer100g: 8.7, fatPer100g: 49, servingUnit: 'tbsp', gramsPerServing: 10 },
    { name: 'Pumpkin Seeds', caloriesPer100g: 559, proteinPer100g: 30, carbsPer100g: 11, fatPer100g: 49, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Sunflower Seeds', caloriesPer100g: 584, proteinPer100g: 21, carbsPer100g: 20, fatPer100g: 51, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'Olive Oil', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, servingUnit: 'tbsp', gramsPerServing: 14 },
    { name: 'Coconut Oil', caloriesPer100g: 862, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, servingUnit: 'tbsp', gramsPerServing: 14 },
    { name: 'Ghee', caloriesPer100g: 900, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, servingUnit: 'tbsp', gramsPerServing: 14 },
    { name: 'Dark Chocolate (70%+)', caloriesPer100g: 598, proteinPer100g: 7.8, carbsPer100g: 46, fatPer100g: 43, servingUnit: 'g', gramsPerServing: 1 },

    // ── SUPERFOODS / ANTI-INFLAMMATORY ────────────────────────────────────────
    { name: 'Turmeric (powder)', caloriesPer100g: 312, proteinPer100g: 9.7, carbsPer100g: 67, fatPer100g: 3.3, servingUnit: 'tbsp', gramsPerServing: 7 },
    { name: 'Ginger (fresh)', caloriesPer100g: 80, proteinPer100g: 1.8, carbsPer100g: 18, fatPer100g: 0.8, servingUnit: 'tbsp', gramsPerServing: 6 },
    { name: 'Garlic (minced)', caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33, fatPer100g: 0.5, servingUnit: 'tbsp', gramsPerServing: 9 },
    { name: 'Moringa (powder)', caloriesPer100g: 292, proteinPer100g: 27, carbsPer100g: 38, fatPer100g: 6, servingUnit: 'tbsp', gramsPerServing: 8 },
    { name: 'Spirulina (powder)', caloriesPer100g: 290, proteinPer100g: 57, carbsPer100g: 24, fatPer100g: 8, servingUnit: 'tbsp', gramsPerServing: 7 },
    { name: 'Wheat Grass (powder)', caloriesPer100g: 198, proteinPer100g: 17, carbsPer100g: 38, fatPer100g: 2, servingUnit: 'tbsp', gramsPerServing: 8 },

    // ── BEVERAGES ─────────────────────────────────────────────────────────────
    { name: 'Green Tea', caloriesPer100g: 1, proteinPer100g: 0.2, carbsPer100g: 0.2, fatPer100g: 0, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Black Coffee', caloriesPer100g: 2, proteinPer100g: 0.3, carbsPer100g: 0, fatPer100g: 0, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Coffee with Milk (latte)', caloriesPer100g: 54, proteinPer100g: 3, carbsPer100g: 5.2, fatPer100g: 2.4, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Coconut Water', caloriesPer100g: 19, proteinPer100g: 0.7, carbsPer100g: 3.7, fatPer100g: 0.2, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Orange Juice (fresh)', caloriesPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10.4, fatPer100g: 0.2, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Protein Shake (made with water)', caloriesPer100g: 60, proteinPer100g: 12, carbsPer100g: 3, fatPer100g: 1, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Banana Milkshake', caloriesPer100g: 95, proteinPer100g: 3.5, carbsPer100g: 16, fatPer100g: 2.5, servingUnit: 'ml', gramsPerServing: 1 },

    // ── PRE/POST WORKOUT FOODS ────────────────────────────────────────────────
    { name: 'Protein Bar', caloriesPer100g: 350, proteinPer100g: 30, carbsPer100g: 35, fatPer100g: 10, servingUnit: 'piece', gramsPerServing: 60 },
    { name: 'Granola Bar', caloriesPer100g: 471, proteinPer100g: 10, carbsPer100g: 64, fatPer100g: 20, servingUnit: 'piece', gramsPerServing: 40 },
    { name: 'Energy Gel', caloriesPer100g: 264, proteinPer100g: 0, carbsPer100g: 66, fatPer100g: 0, servingUnit: 'piece', gramsPerServing: 32 },
    { name: 'Honey', caloriesPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0, servingUnit: 'tbsp', gramsPerServing: 21 },
    { name: 'Rice Cakes', caloriesPer100g: 387, proteinPer100g: 8, carbsPer100g: 81, fatPer100g: 3, servingUnit: 'piece', gramsPerServing: 9 },
    { name: 'Overnight Oats', caloriesPer100g: 140, proteinPer100g: 6, carbsPer100g: 22, fatPer100g: 3.5, servingUnit: 'cup', gramsPerServing: 240 },
    { name: 'Smoothie Bowl (banana, protein)', caloriesPer100g: 110, proteinPer100g: 8, carbsPer100g: 16, fatPer100g: 2, servingUnit: 'cup', gramsPerServing: 300 },

    // ── SUPPLEMENTS ───────────────────────────────────────────────────────────
    { name: 'Creatine Monohydrate', caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, servingUnit: 'g', gramsPerServing: 1 },
    { name: 'BCAAs (branch chain amino acids)', caloriesPer100g: 40, proteinPer100g: 9, carbsPer100g: 0, fatPer100g: 0, servingUnit: 'scoop', gramsPerServing: 8 },

    // ── CONDIMENTS / MISC ─────────────────────────────────────────────────────
    { name: 'Peanut Chutney', caloriesPer100g: 290, proteinPer100g: 10, carbsPer100g: 12, fatPer100g: 23, servingUnit: 'tbsp', gramsPerServing: 20 },
    { name: 'Coconut Chutney', caloriesPer100g: 190, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 17, servingUnit: 'tbsp', gramsPerServing: 20 },
    { name: 'Masala Chai (with milk & sugar)', caloriesPer100g: 42, proteinPer100g: 1.5, carbsPer100g: 6.5, fatPer100g: 1.2, servingUnit: 'ml', gramsPerServing: 1 },
    { name: 'Curd / Raita', caloriesPer100g: 65, proteinPer100g: 3, carbsPer100g: 5, fatPer100g: 3.5, servingUnit: 'cup', gramsPerServing: 200 },
    { name: 'Pickle (mango)', caloriesPer100g: 137, proteinPer100g: 1.2, carbsPer100g: 14, fatPer100g: 9, servingUnit: 'tbsp', gramsPerServing: 15 },
];

const seedDatabase = async () => {
    try {
        // Upsert exercises
        const exerciseOps = defaultExercises.map(e => ({
            updateOne: {
                filter: { name: e.name, isDefault: true },
                update: { $set: { ...e, isDefault: true, userId: null } },
                upsert: true,
            },
        }));
        const exerciseResult = await Exercise.bulkWrite(exerciseOps);
        console.log(`Exercises synced: ${exerciseResult.upsertedCount} added, ${exerciseResult.modifiedCount} updated`);

        // Upsert food items
        const foodOps = defaultFoods.map(f => ({
            updateOne: {
                filter: { name: f.name, isDefault: true },
                update: { $set: { ...f, isDefault: true, userId: null } },
                upsert: true,
            },
        }));
        const foodResult = await FoodItem.bulkWrite(foodOps);
        console.log(`Foods synced: ${foodResult.upsertedCount} added, ${foodResult.modifiedCount} updated`);
    } catch (error) {
        console.error('Error seeding database:', error.message);
    }
};

module.exports = seedDatabase;
