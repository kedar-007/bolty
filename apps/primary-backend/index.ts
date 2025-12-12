import { prisma } from "@bolt/db";
import express from "express";
import cors from "cors";
import { authMiddleware } from './middleware';


const app = express();

app.use(express.json());
app.use(cors());

app.post("/project",authMiddleware,async (req, res) => {
    // console.log("Enterd in to the project creation route")
    try {
        const { prompt } = req.body;
        const userId = req.userId!;
        console.log("Clerk userid",userId);
        // add logic to get a usefull name for the project from the prompt

        const description = prompt.split("\n")[0];
        console.log("Above the route")
        const project = await prisma.project.create({
            data: {
                description,
                userId
            },
        });

        console.log("Project Created",project);

        res.json({projectId:project.id});

    } catch (error) {
        res.json(error)
    }
})


app.get("/projects",authMiddleware,async (req,res) =>{
    try {
        const userId = req.userId!;
        const projects = await prisma.project.findFirst({
            where:{
                userId
            }
        })
        // console.log("Projects",projects);
        res.json(projects)
    } catch (error) {
        res.json(error)
    }
})

app.listen(process.env.PORT || 8080,()=>{
    console.log(`Server is running on port ${process.env.PORT || 8080}`)
})