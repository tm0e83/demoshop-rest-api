declare namespace Express {
  interface Request {
    user?: {
      admin: boolean;
    };
  }
}
