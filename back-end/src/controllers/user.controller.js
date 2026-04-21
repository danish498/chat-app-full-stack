import bcrypt from "bcrypt";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { eq, ilike, or, gt, lt, asc, desc, and, ne } from "drizzle-orm";

export const getUsers = async (req, res, next) => {
  try {
    const { cursor, limit = 20, direction = "forward" } = req.query;

    const parsedLimit = Math.min(parseInt(limit) || 20, 100);

    let whereCondition = undefined;

    // ✅ Cursor handling
    if (cursor) {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );

      const createdAt = new Date(decoded.createdAt); // IMPORTANT
      const id = decoded.id;

      const cursorFilter =
        direction === "forward"
          ? or(
              gt(users.createdAt, createdAt),
              and(eq(users.createdAt, createdAt), gt(users.id, id)),
            )
          : or(
              lt(users.createdAt, createdAt),
              and(eq(users.createdAt, createdAt), lt(users.id, id)),
            );

      whereCondition = cursorFilter;
    }

    let query = db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
      })
      .from(users);

    if (whereCondition) {
      query = query.where(whereCondition);
    }

    query = query
      .orderBy(
        direction === "forward" ? asc(users.createdAt) : desc(users.createdAt),
        direction === "forward" ? asc(users.id) : desc(users.id),
      )
      .limit(parsedLimit + 1);

    const result = await query;

    const hasMore = result.length > parsedLimit;
    const usersData = hasMore ? result.slice(0, parsedLimit) : result;

    if (direction === "backward") {
      usersData.reverse();
    }

    const createCursor = (item) =>
      Buffer.from(
        JSON.stringify({
          createdAt: item.createdAt,
          id: item.id,
        }),
      ).toString("base64");

    let nextCursor = null;
    let prevCursor = null;

    if (usersData.length > 0) {
      nextCursor = createCursor(usersData[usersData.length - 1]);
      prevCursor = createCursor(usersData[0]);
    }

    res.json({
      success: true,
      data: usersData,
      pagination: {
        nextCursor: hasMore ? nextCursor : null,
        prevCursor,
        hasMore,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, displayName, avatarUrl } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        displayName,
        avatarUrl,
      })
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      });

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation (pg error code)
      return res.status(400).json({
        success: false,
        error: { message: "Username or email already exists" },
      });
    }
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
        updatedAt: users.updatedAt,
      });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
    }

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { q, cursor, limit = 20, direction = "forward" } = req.query;

    // ✅ Validate query
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Search query is required" },
      });
    }

    const parsedLimit = Math.min(parseInt(limit) || 20, 100);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      });
    }

    const searchQuery = `%${q.trim()}%`;

    // ✅ Build conditions safely
    const conditions = [
      or(
        ilike(users.username, searchQuery),
        ilike(users.displayName, searchQuery),
        ilike(users.email, searchQuery),
      ),
      ne(users.id, currentUserId), // ❗ exclude self
    ];

    // ✅ Cursor handling
    if (cursor) {
      let decoded;

      try {
        decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: { message: "Invalid cursor" },
        });
      }

      const createdAt = new Date(decoded.createdAt);
      const id = decoded.id;

      const cursorFilter =
        direction === "forward"
          ? or(
              gt(users.createdAt, createdAt),
              and(eq(users.createdAt, createdAt), gt(users.id, id)),
            )
          : or(
              lt(users.createdAt, createdAt),
              and(eq(users.createdAt, createdAt), lt(users.id, id)),
            );

      conditions.push(cursorFilter);
    }

    const whereCondition = and(...conditions);

    // ✅ Query
    const query = db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(
        direction === "forward" ? asc(users.createdAt) : desc(users.createdAt),
        direction === "forward" ? asc(users.id) : desc(users.id),
      )
      .limit(parsedLimit + 1);

    const searchResults = await query;

    const hasMore = searchResults.length > parsedLimit;

    let results = hasMore ? searchResults.slice(0, parsedLimit) : searchResults;

    // ✅ Normalize order for UI
    if (direction === "backward") {
      results.reverse();
    }

    // ✅ Extra safety (never return self)
    results = results.filter((user) => user.id !== currentUserId);

    // ✅ Cursor generator
    const createCursor = (item) =>
      Buffer.from(
        JSON.stringify({
          createdAt: item.createdAt,
          id: item.id,
        }),
      ).toString("base64");

    let nextCursor = null;
    let prevCursor = null;

    if (results.length > 0) {
      nextCursor = createCursor(results[results.length - 1]);
      prevCursor = createCursor(results[0]);
    }

    return res.json({
      success: true,
      data: results,
      pagination: {
        nextCursor: hasMore ? nextCursor : null,
        prevCursor,
        hasMore,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
