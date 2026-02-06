import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = process.env.PORT || 8000;

app.use(express.json());
app.use(
    cors({
        origin: "*",
    })
);

app.get("/",(req,res) => {
    res.json({data:"Hello"})
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

