import { Request, Response } from 'express';
import pool from '../db';
import { OrderUser } from '../models/orderUserModel';

export class OrderUserController {
  
  public getOrderUser = async (req: Request, res: Response) => {
    const orderId = Number(req.params.orderId);
    const userId = req.params.userId as string;

    if (!orderId || !userId) return res.status(400).json({ message: 'Invalid order_id or user_id' });
    const client = await pool.connect();

    try {
      const result = await client.query<OrderUser>(
        `SELECT * FROM order_users WHERE order_id = $1 AND user_id = $2`,
        [orderId, userId]
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

  public getOrderUsers = async (req: Request, res: Response) => {
    const orderId = Number(req.params.orderId);
    if (!orderId) return res.status(400).json({ message: 'Invalid order_id' });
    const client = await pool.connect();

    try {
      const result = await client.query<OrderUser>(
        `SELECT * FROM order_users WHERE order_id = $1`,
        [orderId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public createOrderUser = async (req: Request, res: Response) => {
    const {
      order_id,
      user_id,
      is_owner,
      is_paid,
      amount,
    } = req.body as Partial<OrderUser>;

    if (!order_id || !user_id) {
      return res.status(400).json({ message: "'order_id' and 'user_id' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<OrderUser>(
        `INSERT INTO order_users(order_id, user_id, is_owner, is_paid, amount)
        VALUES($1,$2,$3,$4,$5) RETURNING *`,
        [order_id, user_id, is_owner ?? false, is_paid ?? false, amount]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23505') {
        return res.status(409).json({ message: 'User already in this order' });
      }
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  };

  public updateOrderUser = async (req: Request, res: Response) => {
    const orderId = Number(req.params.orderId);
    const userId = req.params.userId as string;
    const { is_owner, is_paid, amount } = req.body as Partial<OrderUser>;

    if (!orderId || !userId) {
      return res.status(400).json({ message: "'order_id' and 'user_id' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<OrderUser>(
        `UPDATE order_users SET is_owner = $1, is_paid = $2, amount = $3 WHERE order_id = $4 AND user_id = $5 RETURNING *`,
        [is_owner, is_paid, amount, orderId, userId]
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

  public deleteOrderUser = async (req: Request, res: Response) => {
    const orderId = Number(req.params.orderId);
    const userId = req.params.userId as string;

    if (!orderId || !userId) {
      return res.status(400).json({ message: "'order_id' and 'user_id' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM order_users WHERE order_id = $1 AND user_id = $2`,
        [orderId, userId]
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
