import { prisma } from "@bolt/db";
import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware";

const app = express();

app.use(express.json());
app.use(cors());

/**
 * CREATE PROJECT
 */
app.post("/project", authMiddleware, async (req, res) => {
    try {
        const { prompt } = req.body;
        const userId = req.userId!;

        const description = prompt.split("\n")[0];

        const project = await prisma.project.create({
            data: {
                description,
                userId,
            },
        });

        // ✅ return full project
        res.status(201).json({ project });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create project" });
    }
});

/**
 * GET ALL PROJECTS FOR USER
 */
app.get("/projects", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId!;

        const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        // ✅ always an array
        res.json({ projects });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

/**
 * GET PROMPTS FOR PROJECT
 */
app.get("/prompts/:projectId", authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.projectId;

        const prompts = await prisma.prompt.findMany({
            where: { projectId },
            include: { actions: true },
        });

        res.json({ prompts });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch prompts" });
    }
});

app.listen(process.env.PORT || 9090, () => {
    console.log(`Server running on port ${process.env.PORT || 9090}`);
});
