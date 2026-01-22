import { Request, Response } from 'express';
import pool from '../db';
import { OrderItem } from '../models/orderItemModel';

export class OrderItemController {
  
  public getAllOrderItems = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const result = await client.query<OrderItem>(`SELECT * FROM order_items ORDER BY order_item_id`);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public getOrderItem = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const client = await pool.connect();

    try {
      const result = await client.query<OrderItem>(`SELECT * FROM order_items WHERE order_item_id = $1`, [id]);
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public createOrderItem = async (req: Request, res: Response) => {
    const {
      order_id,
      dish_id,
      quantity,
      price,
      user_id,
      person_number,
    } = req.body as Partial<OrderItem>;

    if (!order_id || !dish_id || !quantity || !price || !user_id || !person_number) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<OrderItem>(
        `INSERT INTO order_items(order_id, dish_id, quantity, price, user_id, person_number)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
        [order_id, dish_id, quantity, price, user_id, person_number]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public updateOrderItem = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const allowed: Partial<OrderItem> = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(allowed)) {
      if (key === 'order_item_id' || value === undefined) continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const client = await pool.connect();
    try {
      const q = `UPDATE order_items SET ${fields.join(', ')} WHERE order_item_id = $${idx} RETURNING *`;
      values.push(id);
      const result = await client.query<OrderItem>(q, values);
      if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public deleteOrderItem = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const client = await pool.connect();

    try {
      const result = await client.query(`DELETE FROM order_items WHERE order_item_id = $1`, [id]);
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
