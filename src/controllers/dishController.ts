import { Request, Response } from 'express';
import pool from '../db';
import { Dish } from '../models/dishModel';

export class DishController {
  
  public getAllDishes = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const result = await client.query<Dish>(`SELECT * FROM dishes ORDER BY dish_id`);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public getDish = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const client = await pool.connect();

    try {
      const result = await client.query<Dish>(`SELECT * FROM dishes WHERE dish_id = $1`, [id]);
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public createDish = async (req: Request, res: Response) => {
    const {
      restaurant_id,
      name,
      description,
      allergens,
      price,
      photo_url,
      is_available,
    } = req.body as Partial<Dish>;

    if (!restaurant_id || !name || price === undefined) {
      return res.status(400).json({ message: "'restaurant_id', 'name' and 'price' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<Dish>(
        `INSERT INTO dishes(restaurant_id, name, description, allergens, price, photo_url, is_available)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [restaurant_id, name, description, allergens, price, photo_url, is_available ?? true]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public updateDish = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const allowed: Partial<Dish> = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(allowed)) {
      if (key === 'dish_id' || value === undefined) continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const client = await pool.connect();
    try {
      const q = `UPDATE dishes SET ${fields.join(', ')} WHERE dish_id = $${idx} RETURNING *`;
      values.push(id);
      const result = await client.query<Dish>(q, values);
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public deleteDish = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const client = await pool.connect();

    try {
      const result = await client.query(`DELETE FROM dishes WHERE dish_id = $1`, [id]);
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
