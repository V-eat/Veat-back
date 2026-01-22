import { Request, Response } from "express";
import pool from "../db";
import { User } from "../models/userModel";

export class UserController {

  public getAllUsers = async (req: Request, res: Response) => {

    const client = await pool.connect();
    
    try {
      const result = await client.query<User>(`SELECT * FROM users ORDER BY user_id`);
      res.json(result.rows);
    } 
    catch (err) {
      console.error(err);
      res.status(500).json({ message: "Database error" });
    } 
    finally {
      client.release();
    }
  };

  public getUser = async (req: Request, res: Response) => {

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const client = await pool.connect();

    try {
      const result = await client.query<User>(`SELECT * FROM users WHERE user_id = $1`, [id]);
      if (result.rowCount === 0) return res.status(404).json({ message: "Not found" });
      res.json(result.rows[0]);
    } 
    catch (err) {
      console.error(err);
      res.status(500).json({ message: "Database error" });
    } 
    finally {
      client.release();
    }
  };

  public createUser = async (req: Request, res: Response) => {

    const {
      last_name,
      first_name,
      email,
      password,
      birthdate,
      email_notifications,
      sms_notifications,
      isAdmin,
    } = req.body as Partial<User>;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({ message: "'email' and 'password' are required" });
    }

    if (!last_name || typeof last_name !== "string" || !first_name || typeof first_name !== "string") {
      return res.status(400).json({ message: "'last_name' and 'first_name' are required" });
    }

    if (!birthdate) {
      return res.status(400).json({ message: "'birthdate' are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query<User>(
        `INSERT INTO users(last_name, first_name, email, birthdate, password, email_notifications, sms_notifications, isAdmin)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          last_name,
          first_name,
          email,
          birthdate,
          password,
          email_notifications ?? true,
          sms_notifications ?? false,
          isAdmin ?? false,
        ]
      );
      res.status(201).json(result.rows[0]);
    } 
    catch (err: any) {
      console.error(err);
      if (err.code === "23505") {
        return res.status(409).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Database error" });
    } 
    finally {
      client.release();
    }
  };

  public updateUser = async (req: Request, res: Response) => {

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const allowed: Partial<User> = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(allowed)) {
      if (key === "user_id" || value === undefined) continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    if (fields.length === 0) return res.status(400).json({ message: "No fields to update" });

    const client = await pool.connect();

    try {
      const q = `UPDATE users SET ${fields.join(", ")} WHERE user_id = $${idx} RETURNING *`;
      values.push(id);
      const result = await client.query<User>(q, values);
      if (result.rowCount === 0) return res.status(404).json({ message: "Not found" });
      res.json(result.rows[0]);
    } 
    catch (err) {
      console.error(err);
      res.status(500).json({ message: "Database error" });
    } 
    finally {
      client.release();
    }
  };

  public deleteUser = async (req: Request, res: Response) => {

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const client = await pool.connect();

    try {
      const result = await client.query(`DELETE FROM users WHERE user_id = $1`, [id]);
      if (result.rowCount === 0) return res.status(404).json({ message: "Not found" });
      res.status(204).send();
    } 
    catch (err) {
      console.error(err);
      res.status(500).json({ message: "Database error" });
    } 
    finally {
      client.release();
    }
  };
}

