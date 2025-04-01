// src/types/express.d.ts
declare namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        // add any other properties based on the structure of your `user` object
      };
    }
  }
  