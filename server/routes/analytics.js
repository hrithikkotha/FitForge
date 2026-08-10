const express = require('express');
const WorkoutSession = require('../models/WorkoutSession');
const Exercise = require('../models/Exercise');
const MealEntry = require('../models/MealEntry');
const WeightEntry = require('../models/WeightEntry');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
    calculateBMR,
    calculateTDEE,
    calculateSmoothedWeight,
    calculateExpectedWeightChange,
    calculateCaloriesBurned,
} = require('../utils/calorieCalculator');

const router = express.Router();

// Simple TTL cache for analytics (keyed by userId+endpoint+params, 5-min TTL)
const analyticsCache = new Map();
const ANALYTICS_TTL_MS = 5 * 60 * 1000;

function getCached(key) {
    const entry = analyticsCache.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.data;
    analyticsCache.delete(key);
    return null;
}

function setCache(key, data) {
    analyticsCache.set(key, { data, expiresAt: Date.now() + ANALYTICS_TTL_MS });
    // Limit cache size to 1000 entries
    if (analyticsCache.size > 1000) {
        analyticsCache.delete(analyticsCache.keys().next().value);
    }
}

// GET /api/analytics/muscle/:muscleGroup
router.get('/muscle/:muscleGroup', protect, async (req, res) => {
    try {
        const { muscleGroup } = req.params;
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

        const cacheKey = `muscle:${req.user._id}:${muscleGroup}:${from.getTime()}:${to.getTime()}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const exercises = await Exercise.find({
            muscleGroups: muscleGroup,
            $or: [{ isDefault: true }, { userId: req.user._id }],
        });
        const exerciseIds = exercises.map(e => e._id);

        // Find workout sessions in date range that include those exercises
        const sessions = await WorkoutSession.find({
            userId: req.user._id,
            date: { $gte: from, $lte: to },
            'entries.exerciseId': { $in: exerciseIds },
        }).populate('entries.exerciseId');

        // Calculate stats
        let totalSets = 0;
        let totalReps = 0;
        let totalVolume = 0;
        let totalDuration = 0;
        const exerciseBreakdown = {};
        const sessionDates = [];

        sessions.forEach(session => {
            let sessionRelevant = false;
            session.entries.forEach(entry => {
                if (!entry.exerciseId) return;
                const eMuscles = entry.exerciseId.muscleGroups || [];
                if (eMuscles.includes(muscleGroup)) {
                    sessionRelevant = true;
                    const eName = entry.exerciseId.name;
                    if (!exerciseBreakdown[eName]) {
                        exerciseBreakdown[eName] = { sets: 0, reps: 0, volume: 0, sessions: 0 };
                    }
                    exerciseBreakdown[eName].sessions += 1;

                    if (entry.sets && entry.sets.length > 0) {
                        entry.sets.forEach(set => {
                            totalSets++;
                            totalReps += set.reps || 0;
                            totalVolume += (set.reps || 0) * (set.weight || 0);
                            exerciseBreakdown[eName].sets++;
                            exerciseBreakdown[eName].reps += set.reps || 0;
                            exerciseBreakdown[eName].volume += (set.reps || 0) * (set.weight || 0);
                        });
                    }

                    if (entry.duration) {
                        totalDuration += entry.duration;
                    }
                }
            });
            if (sessionRelevant) {
                sessionDates.push(session.date);
            }
        });

        const topExercises = Object.entries(exerciseBreakdown)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 10);

        const result = {
            muscleGroup,
            period: { from, to },
            totalSessions: sessionDates.length,
            totalSets,
            totalReps,
            totalVolume,
            totalDuration,
            lastTrained: sessionDates.length > 0 ? sessionDates[0] : null,
            topExercises,
            sessionDates,
        };
        setCache(cacheKey, result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/analytics/body-heatmap
router.get('/body-heatmap', protect, async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

        const cacheKey = `heatmap:${req.user._id}:${from.getTime()}:${to.getTime()}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const sessions = await WorkoutSession.find({
            userId: req.user._id,
            date: { $gte: from, $lte: to },
        }).populate('entries.exerciseId');

        const muscleCount = {};
        const allMuscles = [
            'chest', 'shoulders', 'triceps', 'biceps', 'forearms',
            'abs', 'obliques', 'quads', 'hamstrings', 'calves',
            'glutes', 'lats', 'upper_back', 'lower_back', 'traps',
        ];

        allMuscles.forEach(m => { muscleCount[m] = 0; });

        sessions.forEach(session => {
            const sessionMuscles = new Set();
            session.entries.forEach(entry => {
                if (entry.exerciseId && entry.exerciseId.muscleGroups) {
                    entry.exerciseId.muscleGroups.forEach(mg => {
                        sessionMuscles.add(mg);
                    });
                }
            });
            sessionMuscles.forEach(m => {
                if (muscleCount[m] !== undefined) muscleCount[m]++;
            });
        });

        const result = {
            period: { from, to },
            muscleFrequency: muscleCount,
        };
        setCache(cacheKey, result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/analytics/workout-stats
router.get('/workout-stats', protect, async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

        const cacheKey = `workout-stats:${req.user._id}:${from.getTime()}:${to.getTime()}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const sessions = await WorkoutSession.find({
            userId: req.user._id,
            date: { $gte: from, $lte: to },
        }).populate('entries.exerciseId');

        let totalSessions = sessions.length;
        let totalDuration = 0;
        let totalSets = 0;
        let totalVolume = 0;
        const personalRecords = {};
        const volumeOverTime = [];

        sessions.forEach(session => {
            totalDuration += session.duration || 0;
            let sessionVolume = 0;

            session.entries.forEach(entry => {
                if (entry.sets && entry.sets.length > 0) {
                    entry.sets.forEach(set => {
                        totalSets++;
                        const vol = (set.reps || 0) * (set.weight || 0);
                        totalVolume += vol;
                        sessionVolume += vol;

                        if (entry.exerciseId) {
                            const eName = entry.exerciseId.name;
                            if (!personalRecords[eName] || set.weight > personalRecords[eName].weight) {
                                personalRecords[eName] = {
                                    weight: set.weight,
                                    reps: set.reps,
                                    date: session.date,
                                };
                            }
                        }
                    });
                }
            });

            volumeOverTime.push({
                date: session.date,
                volume: sessionVolume,
                title: session.title,
            });
        });

        const prs = Object.entries(personalRecords)
            .map(([exercise, data]) => ({ exercise, ...data }))
            .sort((a, b) => b.weight - a.weight);

        const result = {
            period: { from, to },
            totalSessions,
            totalDuration,
            totalSets,
            totalVolume,
            avgSessionDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
            personalRecords: prs,
            volumeOverTime,
        };
        setCache(cacheKey, result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/analytics/nutrition-stats
router.get('/nutrition-stats', protect, async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

        const cacheKey = `nutrition-stats:${req.user._id}:${from.getTime()}:${to.getTime()}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const meals = await MealEntry.find({
            userId: req.user._id,
            date: { $gte: from, $lte: to },
        }).sort({ date: 1 });

        // Group by date
        const dailyMap = {};
        meals.forEach(meal => {
            const dateKey = new Date(meal.date).toISOString().split('T')[0];
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 };
            }
            dailyMap[dateKey].calories += meal.calories;
            dailyMap[dateKey].protein += meal.protein;
            dailyMap[dateKey].carbs += meal.carbs;
            dailyMap[dateKey].fat += meal.fat;
            dailyMap[dateKey].meals += 1;
        });

        const dailyTrend = Object.entries(dailyMap).map(([date, data]) => ({ date, ...data }));

        const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
        const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
        const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
        const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);
        const daysTracked = Object.keys(dailyMap).length;

        // Meal type breakdown
        const mealTypeBreakdown = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
        meals.forEach(meal => {
            mealTypeBreakdown[meal.mealType] = (mealTypeBreakdown[meal.mealType] || 0) + meal.calories;
        });

        const result = {
            period: { from, to },
            totalCalories,
            totalProtein: Math.round(totalProtein * 10) / 10,
            totalCarbs: Math.round(totalCarbs * 10) / 10,
            totalFat: Math.round(totalFat * 10) / 10,
            daysTracked,
            avgDailyCalories: daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0,
            avgDailyProtein: daysTracked > 0 ? Math.round(totalProtein / daysTracked * 10) / 10 : 0,
            dailyTrend,
            mealTypeBreakdown,
        };
        setCache(cacheKey, result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/analytics/weight-stats
router.get('/weight-stats', protect, async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

        const cacheKey = `weight-stats:${req.user._id}:${from.getTime()}:${to.getTime()}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        // Fetch user data for TDEE calculation
        const user = await User.findById(req.user._id);

        // Fetch weight entries
        const entries = await WeightEntry.find({
            userId: req.user._id,
            date: { $gte: from, $lte: to },
        }).sort({ date: 1 });

        if (entries.length === 0) {
            return res.json({
                entries: [],
                trend: [],
                stats: {
                    daysLogged: 0,
                    consistency: 0,
                    startWeight: 0,
                    currentWeight: user.currentWeight || 0,
                    change: 0,
                    percentChange: 0,
                },
            });
        }

        // Calculate smoothed weights for trend line
        const trend = entries.map((entry, index) => ({
            date: entry.date.toISOString().split('T')[0],
            weight: entry.weight,
            smoothedWeight: calculateSmoothedWeight(entries, index),
            notes: entry.notes,
        }));

        // Calculate basic stats
        const startWeight = entries[0].weight;
        const currentWeight = entries[entries.length - 1].weight;
        const change = Number((currentWeight - startWeight).toFixed(2));
        const percentChange = startWeight > 0 ? Number(((change / startWeight) * 100).toFixed(1)) : 0;

        // Calculate days and consistency
        const totalDays = Math.ceil((to - from) / (24 * 60 * 60 * 1000));
        const daysLogged = entries.length;
        const consistency = totalDays > 0 ? Math.round((daysLogged / totalDays) * 100) : 0;

        // Calculate weekly rate of change
        const daysTracked = (entries[entries.length - 1].date - entries[0].date) / (24 * 60 * 60 * 1000);
        const weeksTracked = daysTracked / 7;
        const avgWeeklyChange = weeksTracked > 0 ? Number((change / weeksTracked).toFixed(2)) : 0;

        // Calculate BMR and TDEE
        const bmr = calculateBMR(
            user.currentWeight || 70,
            user.height || 170,
            user.age || 30,
            user.gender || 'male'
        );
        const tdee = calculateTDEE(bmr, user.activityLevel || 'moderate');

        // Fetch nutrition data for correlation
        const meals = await MealEntry.find({
            userId: req.user._id,
            date: { $gte: from, $lte: to },
        });

        const dailyCalories = {};
        meals.forEach(meal => {
            const dateKey = new Date(meal.date).toISOString().split('T')[0];
            if (!dailyCalories[dateKey]) {
                dailyCalories[dateKey] = 0;
            }
            dailyCalories[dateKey] += meal.calories || 0;
        });

        // Fetch workout data for calorie burn
        const workouts = await WorkoutSession.find({
            userId: req.user._id,
            date: { $gte: from, $lte: to },
        }).populate('entries.exerciseId');

        const dailyCaloriesBurned = {};
        workouts.forEach(workout => {
            const dateKey = new Date(workout.date).toISOString().split('T')[0];
            if (!dailyCaloriesBurned[dateKey]) {
                dailyCaloriesBurned[dateKey] = 0;
            }

            workout.entries.forEach(entry => {
                if (entry.duration && entry.exerciseId) {
                    const calories = calculateCaloriesBurned(
                        entry.exerciseId,
                        entry.duration,
                        user.currentWeight || 70
                    );
                    dailyCaloriesBurned[dateKey] += calories;
                }
            });
        });

        // Calculate average calorie balance
        const calorieKeys = Object.keys(dailyCalories);
        const avgDailyCalories = calorieKeys.length > 0
            ? Math.round(calorieKeys.reduce((sum, key) => sum + dailyCalories[key], 0) / calorieKeys.length)
            : 0;

        const burnKeys = Object.keys(dailyCaloriesBurned);
        const avgCaloriesBurned = burnKeys.length > 0
            ? Math.round(burnKeys.reduce((sum, key) => sum + dailyCaloriesBurned[key], 0) / burnKeys.length)
            : 0;

        const avgDailyBalance = avgDailyCalories - (tdee + avgCaloriesBurned);

        // Calculate expected vs actual weight change
        const expectedChange = calculateExpectedWeightChange(avgDailyBalance, daysTracked);
        const efficiency = expectedChange !== 0 ? Number(((change / expectedChange) * 100).toFixed(0)) : 0;

        // Calculate days to goal
        let daysToGoal = 0;
        if (user.goalWeight && user.goalWeight !== currentWeight && avgWeeklyChange !== 0) {
            const remainingChange = user.goalWeight - currentWeight;
            const weeksToGoal = Math.abs(remainingChange / avgWeeklyChange);
            daysToGoal = Math.ceil(weeksToGoal * 7);

            // Check if direction is correct
            if (user.weightGoalType === 'lose' && avgWeeklyChange > 0) daysToGoal = -1; // Going wrong direction
            if (user.weightGoalType === 'gain' && avgWeeklyChange < 0) daysToGoal = -1; // Going wrong direction
        }

        const result = {
            entries,
            trend,
            stats: {
                daysLogged,
                consistency,
                startWeight,
                currentWeight,
                change,
                percentChange,
                avgWeeklyChange,
                targetWeeklyChange: user.targetWeeklyChange || 0.5,
                goalWeight: user.goalWeight || 0,
                weightGoalType: user.weightGoalType || 'maintain',
                daysToGoal,
            },
            correlation: {
                bmr,
                tdee,
                avgDailyCalories,
                avgCaloriesBurned,
                avgDailyBalance,
                expectedChange,
                actualChange: change,
                efficiency,
            },
            dailyData: trend.map(t => ({
                date: t.date,
                weight: t.weight,
                smoothedWeight: t.smoothedWeight,
                calories: dailyCalories[t.date] || 0,
                caloriesBurned: dailyCaloriesBurned[t.date] || 0,
                balance: (dailyCalories[t.date] || 0) - (tdee + (dailyCaloriesBurned[t.date] || 0)),
            })),
        };

        setCache(cacheKey, result);
        res.json(result);
    } catch (error) {
        console.error('Weight stats error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
