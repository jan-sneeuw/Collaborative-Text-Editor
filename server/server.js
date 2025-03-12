import express from "express";
import { __dirname } from "./utils.js";
import path from "path";

/**
 * Generates an express server.
 * @param {express.Router} router 
 * @returns {import("http").Server}
 */
export function generate_server(router) {
    const PORT = process.env.PORT || 3000; 
    const app = express();
    
    app.set("view engine", "ejs")
    app.set("views", path.join(__dirname, "..", "pages"))
    app.use(express.static(path.join(__dirname, "..", "static")))
    app.use(router)

    return app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
}
