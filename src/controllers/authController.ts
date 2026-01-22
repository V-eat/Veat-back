import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export class AuthController {
  
  public register = async (req: Request, res: Response) => {
    try {
      const { email, password, first_name, last_name, birthdate } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
      }

      if (!first_name || !last_name) {
        return res.status(400).json({ message: 'first_name et last_name requis' });
      }

      console.log(SUPABASE_URL + "/functions/v1/register");

      // Appel à la fonction Edge Supabase
      const response = await fetch(`${SUPABASE_URL}/functions/v1/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': `${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email,
          password,
          first_name,
          last_name,
          birthdate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ message: data.message || 'Erreur lors de l\'inscription' });
      }

      res.status(201).json({ message: 'Inscription réussie', success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

  public login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
      }

      // Appel à la fonction Edge Supabase
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': `${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ message: data.message || 'Erreur lors de la connexion' });
      }

      res.status(200).json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

  public updateUser = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
      }

      const { first_name, last_name, birthdate, email, password } = req.body;

      // Appel à la fonction Edge Supabase
      const response = await fetch(`${SUPABASE_URL}/functions/v1/update-user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          first_name,
          last_name,
          birthdate,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ message: data.message || 'Erreur lors de la mise à jour' });
      }

      res.status(200).json({ message: 'Utilisateur mis à jour avec succès', success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

  public deleteUser = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
      }

      // Appel à la fonction Edge Supabase
      const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ message: data.message || 'Erreur lors de la suppression' });
      }

      res.status(200).json({ message: 'Utilisateur supprimé avec succès', success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

  public getCurrentUser = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
      }

      const token = authHeader.substring(7);
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return res.status(401).json({ message: error.message });
      }

      res.status(200).json(data.user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
}
