import { Request, Response } from 'express';
import pool from '../db';
import { Rating } from '../models/ratingModel';

export class RatingController {
  
  public getRating = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const restaurantId = Number(req.params.restaurantId);

    if (!userId || !restaurantId) return res.status(400).json({ message: 'Invalid user_id or restaurant_id' });
    const client = await pool.connect();

    try {
      const result = await client.query<Rating>(
        `SELECT * FROM rating WHERE user_id = $1 AND restaurant_id = $2`,
        [userId, restaurantId]
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

  public getRestaurantRatings = async (req: Request, res: Response) => {
    const restaurantId = Number(req.params.restaurantId);
    if (!restaurantId) return res.status(400).json({ message: 'Invalid restaurant_id' });
    const client = await pool.connect();

    try {
      const result = await client.query<Rating>(
        `SELECT * FROM rating WHERE restaurant_id = $1`,
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

  public createRating = async (req: Request, res: Response) => {
    const {
      user_id,
      restaurant_id,
      rating,
      commentary,
    } = req.body as Partial<Rating>;

    if (!user_id || !restaurant_id || rating === undefined) {
      return res.status(400).json({ message: "'user_id', 'restaurant_id' and 'rating' are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "'rating' must be between 1 and 5" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<Rating>(
        `INSERT INTO rating(user_id, restaurant_id, rating, commentary)
        VALUES($1,$2,$3,$4) RETURNING *`,
        [user_id, restaurant_id, rating, commentary]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23505') {
        return res.status(409).json({ message: 'User already rated this restaurant' });
      }
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public updateRating = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const restaurantId = Number(req.params.restaurantId);
    const { rating, commentary } = req.body as Partial<Rating>;

    if (!userId || !restaurantId) {
      return res.status(400).json({ message: "'user_id' and 'restaurant_id' are required" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "'rating' must be between 1 and 5" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<Rating>(
        `UPDATE rating SET rating = COALESCE($1, rating), commentary = COALESCE($2, commentary) WHERE user_id = $3 AND restaurant_id = $4 RETURNING *`,
        [rating, commentary, userId, restaurantId]
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

  public deleteRating = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const restaurantId = Number(req.params.restaurantId);

    if (!userId || !restaurantId) {
      return res.status(400).json({ message: "'user_id' and 'restaurant_id' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM rating WHERE user_id = $1 AND restaurant_id = $2`,
        [userId, restaurantId]
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
