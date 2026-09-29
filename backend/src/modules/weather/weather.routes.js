import { Router } from 'express';
import { getWeatherForLocation } from '../../integrations/weather/weather.service.js';

export const weatherRoutes = Router();

weatherRoutes.get('/', async (req, res, next) => {
  try {
    const { destination, date } = req.query;
    if (!destination || !date) {
      return res.status(400).json({ status: 'error', message: 'Missing destination or date' });
    }

    const weather = await getWeatherForLocation(destination, date);
    res.json({
      status: 'success',
      data: weather,
    });
  } catch (err) {
    next(err);
  }
});
