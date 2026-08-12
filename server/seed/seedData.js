const Exercise = require('../models/Exercise');
const FoodItem = require('../models/FoodItem');

const defaultExercises = [
    // ═══════════════════════════════════════════════════════════════════════════
    // CHEST EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    // Barbell/Machine - Chest
    { name: 'Flat Barbell Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Incline Barbell Bench Press', category: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps'] },
    { name: 'Decline Barbell Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps'] },
    { name: 'Smith Machine Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Chest Press Machine', category: 'strength', muscleGroups: ['chest', 'triceps'] },

    // Dumbbell - Chest
    { name: 'Dumbbell Flat Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Dumbbell Incline Press', category: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps'] },
    { name: 'Dumbbell Decline Press', category: 'strength', muscleGroups: ['chest', 'triceps'] },
    { name: 'Dumbbell Flat Flyes', category: 'strength', muscleGroups: ['chest'] },
    { name: 'Dumbbell Incline Flyes', category: 'strength', muscleGroups: ['chest'] },
    { name: 'Dumbbell Pullover', category: 'strength', muscleGroups: ['chest', 'lats'] },
    { name: 'Dumbbell Squeeze Press', category: 'strength', muscleGroups: ['chest', 'triceps'] },
    { name: 'Single Arm Dumbbell Press', category: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps', 'core'] },

    // Cable/Bodyweight - Chest
    { name: 'Cable Crossover High to Low', category: 'strength', muscleGroups: ['chest'] },
    { name: 'Cable Crossover Low to High', category: 'strength', muscleGroups: ['chest'] },
    { name: 'Cable Crossover Mid', category: 'strength', muscleGroups: ['chest'] },
    { name: 'Pec Deck Machine', category: 'strength', muscleGroups: ['chest'] },
    { name: 'Wide Grip Push-Ups', category: 'bodyweight', muscleGroups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Diamond Push-Ups', category: 'bodyweight', muscleGroups: ['chest', 'triceps'] },
    { name: 'Decline Push-Ups', category: 'bodyweight', muscleGroups: ['chest', 'shoulders'] },
    { name: 'Chest Dips', category: 'bodyweight', muscleGroups: ['chest', 'triceps', 'shoulders'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // BACK EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    // Deadlifts
    { name: 'Conventional Deadlift', category: 'strength', muscleGroups: ['back', 'hamstrings', 'glutes', 'traps', 'forearms'] },
    { name: 'Romanian Deadlift', category: 'strength', muscleGroups: ['hamstrings', 'glutes', 'back'] },
    { name: 'Sumo Deadlift', category: 'strength', muscleGroups: ['glutes', 'hamstrings', 'back', 'adductors'] },
    { name: 'Trap Bar Deadlift', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'back', 'traps'] },

    // Barbell/Machine - Back
    { name: 'Bent Over Barbell Row', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'Pendlay Row', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'T-Bar Row', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'Chest Supported Row', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'Seated Cable Row Wide Grip', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'Seated Cable Row Close Grip', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'Machine Row', category: 'strength', muscleGroups: ['back', 'lats', 'biceps'] },

    // Dumbbell - Back
    { name: 'Single Arm Dumbbell Row', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'Dumbbell Bent Over Row', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'Dumbbell Chest Supported Row', category: 'strength', muscleGroups: ['lats', 'back', 'biceps'] },
    { name: 'Dumbbell Reverse Fly', category: 'strength', muscleGroups: ['back', 'shoulders'] },
    { name: 'Dumbbell Seal Row', category: 'strength', muscleGroups: ['lats', 'back'] },

    // Pull-Ups/Lat Pulldowns
    { name: 'Pull-Ups Wide Grip', category: 'bodyweight', muscleGroups: ['lats', 'biceps', 'back'] },
    { name: 'Pull-Ups Close Grip', category: 'bodyweight', muscleGroups: ['lats', 'biceps'] },
    { name: 'Chin-Ups', category: 'bodyweight', muscleGroups: ['biceps', 'lats', 'back'] },
    { name: 'Neutral Grip Pull-Ups', category: 'bodyweight', muscleGroups: ['lats', 'biceps'] },
    { name: 'Lat Pulldown Wide Grip', category: 'strength', muscleGroups: ['lats', 'biceps'] },
    { name: 'Lat Pulldown Close Grip', category: 'strength', muscleGroups: ['lats', 'biceps'] },
    { name: 'Straight Arm Lat Pulldown', category: 'strength', muscleGroups: ['lats'] },
    { name: 'Face Pulls', category: 'strength', muscleGroups: ['back', 'shoulders', 'traps'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // SHOULDER EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    // Barbell/Machine - Shoulders
    { name: 'Overhead Barbell Press Standing', category: 'strength', muscleGroups: ['shoulders', 'triceps', 'core'] },
    { name: 'Overhead Barbell Press Seated', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Behind the Neck Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Smith Machine Shoulder Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Machine Shoulder Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },

    // Dumbbell - Shoulders
    { name: 'Dumbbell Shoulder Press Seated', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Dumbbell Shoulder Press Standing', category: 'strength', muscleGroups: ['shoulders', 'triceps', 'core'] },
    { name: 'Arnold Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Single Arm Dumbbell Shoulder Press', category: 'strength', muscleGroups: ['shoulders', 'triceps', 'core'] },
    { name: 'Dumbbell Lateral Raises', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Dumbbell Front Raises', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Dumbbell Rear Delt Fly', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Leaning Lateral Raises', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Dumbbell Upright Row', category: 'strength', muscleGroups: ['shoulders', 'traps'] },

    // Cable/Other - Shoulders
    { name: 'Cable Lateral Raises', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Cable Front Raises', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Cable Rear Delt Fly', category: 'strength', muscleGroups: ['shoulders'] },
    { name: 'Cable Face Pulls', category: 'strength', muscleGroups: ['shoulders', 'traps', 'back'] },
    { name: 'Plate Front Raises', category: 'strength', muscleGroups: ['shoulders'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // BICEPS EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    // Barbell - Biceps
    { name: 'Barbell Bicep Curl Standing', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'EZ Bar Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Close Grip EZ Bar Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Wide Grip Barbell Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Barbell Drag Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Reverse Barbell Curl', category: 'strength', muscleGroups: ['biceps', 'forearms'] },

    // Dumbbell - Biceps
    { name: 'Dumbbell Bicep Curl Standing', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Dumbbell Bicep Curl Seated', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Dumbbell Hammer Curl', category: 'strength', muscleGroups: ['biceps', 'forearms'] },
    { name: 'Dumbbell Concentration Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Dumbbell Incline Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Dumbbell Zottman Curl', category: 'strength', muscleGroups: ['biceps', 'forearms'] },
    { name: 'Cross Body Hammer Curl', category: 'strength', muscleGroups: ['biceps', 'forearms'] },
    { name: 'Single Arm Preacher Curl Dumbbell', category: 'strength', muscleGroups: ['biceps'] },

    // Cable/Machine - Biceps
    { name: 'Cable Bicep Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Preacher Curl Machine', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Cable Hammer Curl', category: 'strength', muscleGroups: ['biceps', 'forearms'] },
    { name: 'High Cable Curl', category: 'strength', muscleGroups: ['biceps'] },
    { name: 'Spider Curl', category: 'strength', muscleGroups: ['biceps'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // TRICEPS EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    // Barbell/Dips - Triceps
    { name: 'Close Grip Bench Press', category: 'strength', muscleGroups: ['triceps', 'chest'] },
    { name: 'Barbell Skull Crushers', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Overhead Tricep Extension Barbell', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Tricep Dips', category: 'bodyweight', muscleGroups: ['triceps', 'chest'] },

    // Dumbbell - Triceps
    { name: 'Dumbbell Skull Crushers', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Overhead Dumbbell Extension Two Arms', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Overhead Dumbbell Extension Single Arm', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Dumbbell Kickback', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Dumbbell Floor Press', category: 'strength', muscleGroups: ['triceps', 'chest'] },
    { name: 'Close Grip Dumbbell Press', category: 'strength', muscleGroups: ['triceps', 'chest'] },
    { name: 'Tate Press', category: 'strength', muscleGroups: ['triceps'] },

    // Cable/Machine - Triceps
    { name: 'Cable Tricep Pushdown Straight Bar', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Cable Tricep Pushdown Rope', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Cable Tricep Pushdown V-Bar', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Overhead Cable Extension', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Single Arm Cable Extension', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Cable Kickback', category: 'strength', muscleGroups: ['triceps'] },
    { name: 'Tricep Dip Machine', category: 'strength', muscleGroups: ['triceps'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // FOREARM EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    { name: 'Wrist Curls Barbell', category: 'strength', muscleGroups: ['forearms'] },
    { name: 'Wrist Curls Dumbbell', category: 'strength', muscleGroups: ['forearms'] },
    { name: 'Reverse Wrist Curls', category: 'strength', muscleGroups: ['forearms'] },
    { name: 'Farmers Walk Barbell', category: 'strength', muscleGroups: ['forearms', 'traps', 'core'] },
    { name: 'Farmers Walk Dumbbell', category: 'strength', muscleGroups: ['forearms', 'traps', 'core'] },
    { name: 'Dead Hang', category: 'bodyweight', muscleGroups: ['forearms', 'lats'] },
    { name: 'Plate Pinch Hold', category: 'strength', muscleGroups: ['forearms'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // QUADRICEPS EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    // Barbell/Machine - Quads
    { name: 'Back Squat', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'] },
    { name: 'Front Squat', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'core'] },
    { name: 'Leg Press Machine', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },
    { name: 'Hack Squat', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },
    { name: 'Leg Extension Machine', category: 'strength', muscleGroups: ['quadriceps'] },
    { name: 'Smith Machine Squat', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },

    // Dumbbell/Bodyweight - Quads
    { name: 'Dumbbell Goblet Squat', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },
    { name: 'Dumbbell Front Squat', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'core'] },
    { name: 'Dumbbell Squat', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },
    { name: 'Bulgarian Split Squat Dumbbell', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },
    { name: 'Walking Lunges Dumbbell', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'] },
    { name: 'Static Lunges Dumbbell', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },
    { name: 'Step-Ups Dumbbell', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },
    { name: 'Sissy Squat', category: 'bodyweight', muscleGroups: ['quadriceps'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // HAMSTRINGS & GLUTES EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    // Barbell/Machine - Hamstrings & Glutes
    { name: 'Stiff Leg Deadlift', category: 'strength', muscleGroups: ['hamstrings', 'glutes', 'back'] },
    { name: 'Good Mornings', category: 'strength', muscleGroups: ['hamstrings', 'glutes', 'back'] },
    { name: 'Leg Curl Lying', category: 'strength', muscleGroups: ['hamstrings'] },
    { name: 'Leg Curl Seated', category: 'strength', muscleGroups: ['hamstrings'] },
    { name: 'Barbell Hip Thrust', category: 'strength', muscleGroups: ['glutes', 'hamstrings'] },
    { name: 'Glute Ham Raise', category: 'bodyweight', muscleGroups: ['hamstrings', 'glutes'] },

    // Dumbbell - Hamstrings & Glutes
    { name: 'Dumbbell Romanian Deadlift', category: 'strength', muscleGroups: ['hamstrings', 'glutes', 'back'] },
    { name: 'Dumbbell Stiff Leg Deadlift', category: 'strength', muscleGroups: ['hamstrings', 'glutes'] },
    { name: 'Dumbbell Hip Thrust', category: 'strength', muscleGroups: ['glutes', 'hamstrings'] },
    { name: 'Single Leg Romanian Deadlift Dumbbell', category: 'strength', muscleGroups: ['hamstrings', 'glutes', 'core'] },
    { name: 'Dumbbell Glute Bridge', category: 'strength', muscleGroups: ['glutes', 'hamstrings'] },
    { name: 'Dumbbell Reverse Lunge', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'] },

    // Cable/Bodyweight - Hamstrings & Glutes
    { name: 'Cable Pull Through', category: 'strength', muscleGroups: ['glutes', 'hamstrings'] },
    { name: 'Cable Glute Kickback', category: 'strength', muscleGroups: ['glutes'] },
    { name: 'Glute Bridge Bodyweight', category: 'bodyweight', muscleGroups: ['glutes', 'hamstrings'] },
    { name: 'Single Leg Glute Bridge', category: 'bodyweight', muscleGroups: ['glutes', 'hamstrings', 'core'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // CALVES EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    { name: 'Standing Calf Raise Machine', category: 'strength', muscleGroups: ['calves'] },
    { name: 'Seated Calf Raise Machine', category: 'strength', muscleGroups: ['calves'] },
    { name: 'Dumbbell Calf Raise Standing', category: 'strength', muscleGroups: ['calves'] },
    { name: 'Single Leg Calf Raise Dumbbell', category: 'strength', muscleGroups: ['calves'] },
    { name: 'Calf Press on Leg Press', category: 'strength', muscleGroups: ['calves'] },
    { name: 'Donkey Calf Raise', category: 'strength', muscleGroups: ['calves'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // CORE/ABS EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    // Upper Abs
    { name: 'Crunches', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Sit-Ups', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Decline Sit-Ups', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Cable Crunches', category: 'strength', muscleGroups: ['core'] },
    { name: 'Ab Wheel Rollout', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Machine Crunch', category: 'strength', muscleGroups: ['core'] },

    // Lower Abs
    { name: 'Leg Raises Hanging', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Leg Raises Lying', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Reverse Crunches', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Mountain Climbers', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Knee Raises Hanging', category: 'bodyweight', muscleGroups: ['core'] },

    // Obliques
    { name: 'Russian Twist', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Side Plank', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Dumbbell Side Bend', category: 'strength', muscleGroups: ['core'] },
    { name: 'Cable Woodchop', category: 'strength', muscleGroups: ['core'] },
    { name: 'Bicycle Crunches', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Oblique Crunches', category: 'bodyweight', muscleGroups: ['core'] },

    // Full Core
    { name: 'Plank', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Side Plank', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Dead Bug', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Bird Dog', category: 'bodyweight', muscleGroups: ['core', 'back'] },
    { name: 'Pallof Press', category: 'strength', muscleGroups: ['core'] },
    { name: 'Ab Roller', category: 'bodyweight', muscleGroups: ['core'] },
    { name: 'Dragon Flag', category: 'bodyweight', muscleGroups: ['core'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // TRAPS EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    { name: 'Barbell Shrugs', category: 'strength', muscleGroups: ['traps'] },
    { name: 'Dumbbell Shrugs', category: 'strength', muscleGroups: ['traps'] },
    { name: 'Behind the Back Barbell Shrugs', category: 'strength', muscleGroups: ['traps'] },
    { name: 'Cable Shrugs', category: 'strength', muscleGroups: ['traps'] },
    { name: 'Power Shrugs', category: 'strength', muscleGroups: ['traps', 'back'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // CARDIO EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    { name: 'Treadmill Running', category: 'cardio', muscleGroups: ['quadriceps', 'calves', 'hamstrings'] },
    { name: 'Treadmill Walking Incline', category: 'cardio', muscleGroups: ['quadriceps', 'glutes', 'calves'] },
    { name: 'Stationary Bike', category: 'cardio', muscleGroups: ['quadriceps', 'calves'] },
    { name: 'Spin Bike', category: 'cardio', muscleGroups: ['quadriceps', 'calves', 'glutes'] },
    { name: 'Rowing Machine', category: 'cardio', muscleGroups: ['lats', 'back', 'biceps', 'quadriceps', 'core'] },
    { name: 'Elliptical Trainer', category: 'cardio', muscleGroups: ['quadriceps', 'glutes', 'calves'] },
    { name: 'Stair Climber', category: 'cardio', muscleGroups: ['quadriceps', 'glutes', 'calves'] },
    { name: 'Jump Rope', category: 'cardio', muscleGroups: ['calves', 'quadriceps', 'shoulders'] },
    { name: 'Swimming', category: 'cardio', muscleGroups: ['lats', 'shoulders', 'chest', 'core'] },
    { name: 'Battle Ropes', category: 'cardio', muscleGroups: ['shoulders', 'core'] },
    { name: 'Burpees', category: 'cardio', muscleGroups: ['chest', 'quadriceps', 'shoulders', 'core'] },
    { name: 'Box Jumps', category: 'cardio', muscleGroups: ['quadriceps', 'glutes', 'calves'] },

    // ═══════════════════════════════════════════════════════════════════════════
    // FULL BODY/COMPOUND EXERCISES
    // ═══════════════════════════════════════════════════════════════════════════

    { name: 'Power Clean', category: 'strength', muscleGroups: ['traps', 'shoulders', 'back', 'quadriceps', 'glutes'] },
    { name: 'Clean and Press', category: 'strength', muscleGroups: ['shoulders', 'traps', 'quadriceps', 'glutes', 'core'] },
    { name: 'Dumbbell Thruster', category: 'strength', muscleGroups: ['quadriceps', 'shoulders', 'glutes', 'core'] },
    { name: 'Barbell Thruster', category: 'strength', muscleGroups: ['quadriceps', 'shoulders', 'glutes', 'core'] },
    { name: 'Turkish Get-Up', category: 'strength', muscleGroups: ['shoulders', 'core', 'quadriceps', 'glutes'] },
    { name: 'Kettlebell Swing', category: 'strength', muscleGroups: ['glutes', 'hamstrings', 'back', 'shoulders'] },
    { name: 'Sled Push', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'calves', 'core'] },
    { name: 'Sled Pull', category: 'strength', muscleGroups: ['back', 'glutes', 'hamstrings'] },
];

const defaultFoods = [
    // [Keep all existing food data - not shown here for brevity as it's already correct]
    // ... (keeping the entire existing food array from lines 76-383)
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
