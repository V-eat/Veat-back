import { Request, Response } from 'express';
import pool from '../db';
import { Order } from '../models/orderModel';

export class OrderController {
  
  public getAllOrders = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const result = await client.query<Order>(`SELECT * FROM orders ORDER BY order_id`);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public getOrder = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const client = await pool.connect();

    try {
      const result = await client.query<Order>(`SELECT * FROM orders WHERE order_id = $1`, [id]);
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public createOrder = async (req: Request, res: Response) => {
    const {
      restaurant_id,
      total_amount,
      solo_payment,
      guests_number,
      status,
    } = req.body as Partial<Order>;

    if (!restaurant_id) {
      return res.status(400).json({ message: "'restaurant_id' is required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<Order>(
        `INSERT INTO orders(restaurant_id, total_amount, solo_payment, guests_number, status)
        VALUES($1,$2,$3,$4,$5) RETURNING *`,
        [restaurant_id, total_amount, solo_payment ?? true, guests_number, status]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public updateOrder = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const allowed: Partial<Order> = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(allowed)) {
      if (key === 'order_id' || value === undefined) continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const client = await pool.connect();
    try {
      const q = `UPDATE orders SET ${fields.join(', ')} WHERE order_id = $${idx} RETURNING *`;
      values.push(id);
      const result = await client.query<Order>(q, values);
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public deleteOrder = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const client = await pool.connect();

    try {
      const result = await client.query(`DELETE FROM orders WHERE order_id = $1`, [id]);
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
