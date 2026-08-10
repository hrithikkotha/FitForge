// MET (Metabolic Equivalent of Task) values for different exercise categories
const MET_VALUES = {
    strength: 6.0,           // Moderate weight lifting
    cardio: 7.0,             // Default cardio (moderate)
    cardio_light: 5.0,       // Walking 4mph
    cardio_moderate: 7.0,    // Running 6mph
    cardio_intense: 10.0,    // Running 8mph
    bodyweight: 4.0,         // Calisthenics
};

/**
 * Calculate calories burned during exercise using MET formula
 * Formula: Calories = MET × weight(kg) × duration(hours)
 *
 * @param {Object} exercise - Exercise object with category
 * @param {Number} duration - Duration in minutes
 * @param {Number} weightKg - User weight in kg
 * @returns {Number} Calories burned
 */
function calculateCaloriesBurned(exercise, duration, weightKg) {
    if (!duration || !weightKg || duration <= 0 || weightKg <= 0) {
        return 0;
    }

    const category = exercise?.category || 'cardio';
    const met = MET_VALUES[category] || MET_VALUES.cardio;

    // Convert duration from minutes to hours
    const durationHours = duration / 60;

    return Math.round(met * weightKg * durationHours);
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 * Most accurate equation for modern populations
 *
 * @param {Number} weightKg - Weight in kg
 * @param {Number} heightCm - Height in cm
 * @param {Number} age - Age in years
 * @param {String} gender - 'male' or 'female'
 * @returns {Number} BMR in calories/day
 */
function calculateBMR(weightKg, heightCm, age, gender) {
    if (!weightKg || !heightCm || !age || weightKg <= 0 || heightCm <= 0 || age <= 0) {
        return 0;
    }

    // Mifflin-St Jeor Equation
    if (gender === 'male') {
        return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5);
    } else {
        return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161);
    }
}

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR × Activity Multiplier
 *
 * @param {Number} bmr - Basal Metabolic Rate
 * @param {String} activityLevel - Activity level enum
 * @returns {Number} TDEE in calories/day
 */
function calculateTDEE(bmr, activityLevel) {
    const multipliers = {
        sedentary: 1.2,      // Little/no exercise
        light: 1.375,        // 1-3 days/week
        moderate: 1.55,      // 3-5 days/week
        active: 1.725,       // 6-7 days/week
        very_active: 1.9,    // 2x per day
    };

    const multiplier = multipliers[activityLevel] || multipliers.moderate;
    return Math.round(bmr * multiplier);
}

/**
 * Calculate recommended daily calorie intake based on goals
 *
 * @param {Number} tdee - Total Daily Energy Expenditure
 * @param {String} goalType - 'lose', 'gain', or 'maintain'
 * @param {Number} targetWeeklyChange - Target kg per week (positive number)
 * @returns {Number} Recommended daily calories
 */
function calculateRecommendedCalories(tdee, goalType, targetWeeklyChange) {
    if (goalType === 'maintain') {
        return tdee;
    }

    // 1 kg fat = 7700 calories
    // Weekly deficit/surplus = targetWeeklyChange × 7700
    // Daily deficit/surplus = (targetWeeklyChange × 7700) / 7
    const dailyCalorieAdjustment = Math.round((targetWeeklyChange * 7700) / 7);

    if (goalType === 'lose') {
        return tdee - dailyCalorieAdjustment;
    } else if (goalType === 'gain') {
        return tdee + dailyCalorieAdjustment;
    }

    return tdee;
}

/**
 * Calculate 7-day rolling average for weight smoothing
 *
 * @param {Array} entries - Array of weight entries sorted by date
 * @param {Number} index - Current index
 * @returns {Number} Smoothed weight
 */
function calculateSmoothedWeight(entries, index) {
    const windowSize = 7;
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(entries.length, start + windowSize);

    const window = entries.slice(start, end);
    const sum = window.reduce((acc, entry) => acc + entry.weight, 0);

    return Number((sum / window.length).toFixed(2));
}

/**
 * Calculate expected weight change based on calorie deficit/surplus
 *
 * @param {Number} avgDailyBalance - Average daily calorie balance (negative = deficit)
 * @param {Number} days - Number of days
 * @returns {Number} Expected weight change in kg (negative = loss)
 */
function calculateExpectedWeightChange(avgDailyBalance, days) {
    // 1 kg fat = 7700 calories
    // Negative balance = weight loss (negative change)
    return Number(((avgDailyBalance * days) / 7700).toFixed(2));
}

module.exports = {
    calculateCaloriesBurned,
    calculateBMR,
    calculateTDEE,
    calculateRecommendedCalories,
    calculateSmoothedWeight,
    calculateExpectedWeightChange,
    MET_VALUES,
};
