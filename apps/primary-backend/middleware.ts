import type { Request, Response, NextFunction } from "express";
import type  { JwtPayload } from "jsonwebtoken";
import  jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token missing" });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Verify RS256 signed token
    const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
      algorithms: ["RS256"],
    }) as JwtPayload;

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.userId = decoded.sub; // Clerk uses `sub` as the user ID
    next();

  } catch (error) {
    console.error("JWT verify error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
}
