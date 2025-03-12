// import { doc_model } from "./model.js";
import { connect_to_db } from "./mongodb.js";
import { router } from "./router.js";
import { generate_server } from "./server.js";
import { handle_sockets } from "./socket.js";
import dotenv from "dotenv"

/**
 * Initializes the application.
 */
async function init() {
    dotenv.config()
    const server = generate_server(router)
    handle_sockets(server)
    // console.log(process.env.MONGODB_URI)
    await connect_to_db()
    // const doc = new doc_model()
    // const saved_doc = await doc.save()
    // console.log(saved_doc);
}

init()