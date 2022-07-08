import express from "express";
export async function createApp() {
    const app = express();
    app.get("/", (req, res) => {
        res.status(200).json({
            message: "Papi",
        });
    });
    return app;
}
