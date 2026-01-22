import { Request, Response } from 'express';
import pool from '../db';
import { Favorite } from '../models/favoriteModel';

export class FavoriteController {
  
  public getFavorite = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const restaurantId = Number(req.params.restaurantId);

    if (!userId || !restaurantId) return res.status(400).json({ message: 'Invalid user_id or restaurant_id' });
    const client = await pool.connect();

    try {
      const result = await client.query<Favorite>(
        `SELECT * FROM favorite WHERE user_id = $1 AND restaurant_id = $2`,
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

  public getUserFavorites = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    if (!userId) return res.status(400).json({ message: 'Invalid user_id' });
    const client = await pool.connect();

    try {
      const result = await client.query<Favorite>(
        `SELECT * FROM favorite WHERE user_id = $1`,
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public createFavorite = async (req: Request, res: Response) => {
    const {
      user_id,
      restaurant_id,
    } = req.body as Partial<Favorite>;

    if (!user_id || !restaurant_id) {
      return res.status(400).json({ message: "'user_id' and 'restaurant_id' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<Favorite>(
        `INSERT INTO favorite(user_id, restaurant_id)
        VALUES($1,$2) RETURNING *`,
        [user_id, restaurant_id]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23505') {
        return res.status(409).json({ message: 'Already in favorites' });
      }
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public deleteFavorite = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const restaurantId = Number(req.params.restaurantId);

    if (!userId || !restaurantId) {
      return res.status(400).json({ message: "'user_id' and 'restaurant_id' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM favorite WHERE user_id = $1 AND restaurant_id = $2`,
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
