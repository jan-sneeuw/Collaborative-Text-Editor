// import { doc_model } from "./model.js";
import { purge_old_docs } from "./docs.js";
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
    await connect_to_db()
    await purge_old_docs()
}

init()