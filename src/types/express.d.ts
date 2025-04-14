// src/types/express.d.ts
declare namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        role: string;
        anganwadiId?: string | null;
      };
    }
  }
  