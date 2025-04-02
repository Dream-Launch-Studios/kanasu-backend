// src/types/express.d.ts
declare namespace Express {
    interface Request {
      user?: {
        name: string;
        id: string;
        role: string;
        
      };
    }
  }
  