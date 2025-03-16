import {Server} from "socket.io"
import { delete_doc_from_memory, get_doc_in_memory, get_or_create_doc_in_memory } from "./docs_memory.js"
import { delete_doc, update_doc } from "./docs.js"

/**
 * @typedef {import("socket.io").Socket} Socket
 */

/**
 * Handles socket connection
 * @param {import("http").Server} server 
 */
export function handle_sockets(server) {
    const io = new Server(server)
    
    io.on("connection", (socket) => {
        socket.on("join", (doc_id) => handle_join(socket, doc_id))
        socket.on("title", (title) => handle_input(socket, "title", title))
        socket.on("text", (text) => handle_input(socket, "text", text))
        socket.on("name", (name) => handle_name(socket, name))
        socket.on("disconnect", () => handle_disconnect(socket))
        socket.on("delete", () => handle_delete(socket))
    })

    /**
     * @param {Socket} socket 
     * @param {string} doc_id 
     */
    function handle_join(socket, doc_id) {
        const doc_mem = get_or_create_doc_in_memory(doc_id)
        socket.join(doc_id)
        socket.data.doc_id = doc_id
        socket.data.name = "Anonymous"
        doc_mem.editors[socket.id] = socket.data.name
    }

    /**
     * Updates a document's title or text
     * @param {Socket} socket 
     * @param {"text" | "title"} event
     * @param {string} value 
     */
    function handle_input(socket, event, value) {
        const doc_id = socket.data.doc_id
        const doc_mem = get_doc_in_memory(doc_id)
        if (!doc_mem) return

        /**
         * This is either 'text_editor' or 'title_editor'.
         * @type {"text_editor" | "title_editor"} 
         */
        const editor_key = `${event}_editor`
        
        /**
         * @type {"text_timeout" | "title_timeout"} 
         */
        const timeout_key = `${event}_timeout`
       
        /**
         * @type {"allow_text_input" | "allow_title_input"} 
         */
        const allow_event = `allow_${event}_input`

        /**
         * @type {"text_status" | "title_status"}
         */
        const status_event = `${event}_status`

        // Check if someone is typing right this moment. I.e. if the editor exists
        // but is not the current editor, then is not allowed to write.
        const previous_editor = doc_mem[editor_key]
        if (previous_editor && previous_editor !== socket.id) return

        // Otherwise is allowed to write
        doc_mem[editor_key] = socket.id

        // If I'm just starting to type, need to broadcast this to all users but myself.
        // Also, send status (who's typing) to everyone, including myself. 
        if (!previous_editor) {
            socket.to(doc_id).emit(allow_event, false)
            io.to(doc_id).emit(status_event, `${socket.data.name} is typing...`)
        }

        socket.to(doc_id).emit(event, value)

        const timeout = doc_mem[timeout_key]

        // Update timeout while someone is typing.
        if (timeout) {
            clearTimeout(timeout)
            doc_mem[timeout_key] = null
        }

        // If timeout has run out, open document for others to edit.
        // Shows text on screen who is typing and that document has been saved.
        doc_mem[timeout_key] = setTimeout(async () => {
            doc_mem[editor_key] = null
            doc_mem[timeout_key] = null
            socket.to(doc_id).emit(allow_event, true)

            const { error } = await update_doc(doc_id, { [event]: value })
            const save_status = error ? "Error while saving..." : "Saved!"
            io.to(doc_id).emit(status_event, save_status)
            setTimeout(() => {
                if (doc_mem[editor_key]) return
                io.to(doc_id).emit(status_event, "")
            }, 1500)
        }, 1000)
    }

    /**
     * @param {Socket} socket 
     * @param {string} name 
     */
    function handle_name(socket, name) {
        socket.data.name = name
        const doc_id = socket.data.doc_id
        const doc_mem = get_doc_in_memory(doc_id)
        if (!doc_mem) return
        
        doc_mem.editors[socket.id] = name
        send_editor_names(doc_mem)
    }

    /**
     * Sends the names of the editors in a given document to all editors.
     * @param {import("./docs_memory.js").Doc_memory} doc_mem - The selected document. 
     */
    function send_editor_names(doc_mem) {
        io.to(doc_mem.id).emit("editor_names", Object.values(doc_mem.editors))
    }

    /**
     * @param {Socket} socket 
     */
    function handle_disconnect(socket) {
        const doc_id = socket.data.doc_id
        socket.leave(doc_id)
        const doc_mem = get_doc_in_memory(doc_id)
        if (!doc_mem) return
        delete doc_mem.editors[socket.id]
        send_editor_names(doc_mem)
    }

    /**
     * Deletes a document from memory.
     * @param {Socket} socket 
     */
    async function handle_delete(socket) {
        const doc_id = socket.data.doc_id
        if (!doc_id) return
        delete_doc_from_memory(doc_id)
        const { error } = await delete_doc(doc_id)
        if (error) return
        io.to(doc_id).emit("deleted") 
    }
}