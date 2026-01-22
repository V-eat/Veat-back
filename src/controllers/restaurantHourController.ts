import { Request, Response } from 'express';
import pool from '../db';
import { RestaurantHour } from '../models/restaurantHourModel';

export class RestaurantHourController {
  
  public getRestaurantHours = async (req: Request, res: Response) => {
    const restaurantId = Number(req.params.restaurantId);
    if (!restaurantId) return res.status(400).json({ message: 'Invalid restaurant id' });
    const client = await pool.connect();

    try {
      const result = await client.query<RestaurantHour>(
        `SELECT * FROM restaurant_hours WHERE restaurant_id = $1 ORDER BY day_of_week`,
        [restaurantId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public createRestaurantHour = async (req: Request, res: Response) => {
    const {
      restaurant_id,
      day_of_week,
      open_time,
      close_time,
    } = req.body as Partial<RestaurantHour>;

    if (!restaurant_id || day_of_week === undefined) {
      return res.status(400).json({ message: "'restaurant_id' and 'day_of_week' are required" });
    }

    if (day_of_week < 1 || day_of_week > 7) {
      return res.status(400).json({ message: "'day_of_week' must be between 1 and 7" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<RestaurantHour>(
        `INSERT INTO restaurant_hours(restaurant_id, day_of_week, open_time, close_time)
        VALUES($1,$2,$3,$4) RETURNING *`,
        [restaurant_id, day_of_week, open_time, close_time]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23505') {
        return res.status(409).json({ message: 'Hours already exist for this day' });
      }
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public updateRestaurantHour = async (req: Request, res: Response) => {
    const restaurantId = Number(req.params.restaurantId);
    const { day_of_week, open_time, close_time } = req.body as Partial<RestaurantHour>;

    if (!restaurantId || day_of_week === undefined) {
      return res.status(400).json({ message: "'restaurant_id' and 'day_of_week' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<RestaurantHour>(
        `UPDATE restaurant_hours SET open_time = $1, close_time = $2 WHERE restaurant_id = $3 AND day_of_week = $4 RETURNING *`,
        [open_time, close_time, restaurantId, day_of_week]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public deleteRestaurantHour = async (req: Request, res: Response) => {
    const restaurantId = Number(req.params.restaurantId);
    const { day_of_week } = req.body as Partial<RestaurantHour>;

    if (!restaurantId || day_of_week === undefined) {
      return res.status(400).json({ message: "'restaurant_id' and 'day_of_week' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM restaurant_hours WHERE restaurant_id = $1 AND day_of_week = $2`,
        [restaurantId, day_of_week]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };
}
