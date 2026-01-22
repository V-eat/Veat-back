import { Request, Response } from 'express';
import pool from '../db';
import { Restaurant } from '../models/restaurantModel';

export class RestaurantController {
  
  public getAllRestaurants = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const result = await client.query<Restaurant>(`SELECT * FROM restaurants ORDER BY restaurant_id`);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public getRestaurant = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const client = await pool.connect();

    try {
      const result = await client.query<Restaurant>(`SELECT * FROM restaurants WHERE restaurant_id = $1`, [id]);
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public createRestaurant = async (req: Request, res: Response) => {
    const {
      owner_id,
      name,
      email,
      phone,
      description,
      adresse,
      latitude,
      longitude,
      cuisine_type,
      preparation_time,
      commission_rate,
    } = req.body as Partial<Restaurant>;

    if (!owner_id || !name || !email) {
      return res.status(400).json({ message: "'owner_id', 'name' and 'email' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<Restaurant>(
        `INSERT INTO restaurants(owner_id, name, email, phone, description, adresse, latitude, longitude, cuisine_type, preparation_time, commission_rate)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [owner_id, name, email, phone, description, adresse, latitude, longitude, cuisine_type, preparation_time, commission_rate]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23505') {
        return res.status(409).json({ message: 'Email already exists' });
      }
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public updateRestaurant = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const allowed: Partial<Restaurant> = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(allowed)) {
      if (key === 'restaurant_id' || value === undefined) continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const client = await pool.connect();
    try {
      const q = `UPDATE restaurants SET ${fields.join(', ')} WHERE restaurant_id = $${idx} RETURNING *`;
      values.push(id);
      const result = await client.query<Restaurant>(q, values);
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public deleteRestaurant = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const client = await pool.connect();

    try {
      const result = await client.query(`DELETE FROM restaurants WHERE restaurant_id = $1`, [id]);
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
