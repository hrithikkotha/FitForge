const express = require('express');
const WorkoutSession = require('../models/WorkoutSession');
const Exercise = require('../models/Exercise');
const MealEntry = require('../models/MealEntry');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/muscle/:muscleGroup
router.get('/muscle/:muscleGroup', protect, async (req, res) => {
    try {
        const { muscleGroup } = req.params;
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

        // Find exercises targeting this muscle group
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

        res.json({
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
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/analytics/body-heatmap
router.get('/body-heatmap', protect, async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

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

        res.json({
            period: { from, to },
            muscleFrequency: muscleCount,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/analytics/workout-stats
router.get('/workout-stats', protect, async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

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

        res.json({
            period: { from, to },
            totalSessions,
            totalDuration,
            totalSets,
            totalVolume,
            avgSessionDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
            personalRecords: prs,
            volumeOverTime,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/analytics/nutrition-stats
router.get('/nutrition-stats', protect, async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

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

        res.json({
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
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
