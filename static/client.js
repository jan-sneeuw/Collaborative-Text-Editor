/**
 * Textarea for the document
 */
const textarea = /** @type {HTMLTextAreaElement} */ (
    document.querySelector("textarea")
)

/**
 * The title input element of the document
 */
const title_input = /** @type {HTMLInputElement} */ (
    document.querySelector("#title_input")
)

/**
 * The name input element of the document
 */
const name_input = /** @type {HTMLInputElement} */ ( 
    document.querySelector("#name_input")
)

/**
 * The button to copy the URL of the document
 */
const copy_button = /** @type {HTMLButtonElement} */ ( 
    document.querySelector("#copy_btn")
)

/**
 * The button to delete the document
 */
const delete_button = /** @type {HTMLButtonElement} */ (
    document.querySelector("#delete_btn")
)

/**
 * The main element of the document
 */
const main_element = /** @type {HTMLElement} */ (
    document.querySelector("main")
)

/**
 * The status element of the text
 */
const text_status = /** @type {HTMLElement} */ (
    document.querySelector("#text_status")
)

/**
 * The status element for the title
 */
const title_status = /** @type {HTMLElement} */ (
    document.querySelector("#title_status")
)

/**
 * The element to display the names of the editors
 */
const editor_names_display = /** @type {HTMLElement} */ (
    document.querySelector("#editor_names")
)

/**
 * The element to display the word count
 */
const word_count_display = /** @type {HTMLElement} */ (
    document.querySelector("#word_count")
)


//---------------------------------------------------------------//


/**
 * Gets the document ID from the body's data attribute.
 * @returns {string} The document ID
 */
function get_doc_id() {
    return document.body.getAttribute('data-doc-id') ?? ""
}

//@ts-ignore
const io = window.io 

/**
 * @typedef {import("socket.io").Socket} Socket
 */

/**
 * Initializes the client application
 */
function init() {
    /**
     * @type {Socket}
     */
    const socket = io()
    socket.on("connect", () => {
        //console.log("My name is", socket.id)
        handle_sockets(socket)
    })
    enable_copy_button()
    display_word_count(textarea?.value ?? "")
    add_to_recent_docs()
}

init()

/**
 * Handles the socket events.
 * @param {Socket} socket
 */
function handle_sockets(socket) {
    join(socket)
    sync_title(socket)
    sync_text(socket)
    sync_name(socket)
    show_editor_names(socket)
    handle_delete(socket)
}

/**
 * Joins the socket to the document's room.
 * @param {Socket} socket - The socket to be handled
 */
function join(socket) {
    socket.emit("join", get_doc_id())
}

/**
 * Sync the title of the document with the server.
 * @param {Socket} socket 
 */
function sync_title(socket) {
    sync_input(socket, "title", title_input, title_status, (title) => {
        document.title = title
        add_to_recent_docs()
    })
}

/**
 * Sync the text of the document with the server.
 * @param {Socket} socket 
 */
function sync_text(socket) {
    sync_input(socket, "text", textarea, text_status, (value) => {
        display_word_count(value)
    })
}

/**
 * General function to sync an input element between the client and the server.
 * @param {Socket} socket 
 * @param {string} event 
 * @param {HTMLInputElement | HTMLTextAreaElement} input_element
 * @param {HTMLElement} status_element 
 * @param {((value:string) => void) | undefined} callback 
 */
function sync_input(socket, event, input_element, status_element, callback) {

    input_element.addEventListener("input", () => {
        socket.emit(event, input_element.value)
        if (callback) callback(input_element.value)
    })

    socket.on(
        event, 
        /** @param {string} value */ (value) => {
            input_element.value = value
            if (callback) callback(value)
        }
    )

    socket.on(
        `allow_${event}_input`, 
        /** @param {boolean} allow */ (allow) => {
            input_element.disabled = !allow
        }
    )

    // Show status or show non-breaking space, so there is always something.
    socket.on(
        `${event}_status`, 
        /** @param {string} status */ (status) => {
            status_element.innerHTML = status ? status : "&nbsp;"
        }
    )
}

/**
 * Syncs the name of the user with the server.
 * @param {Socket} socket 
 */
function sync_name(socket) {
    
    const my_name = localStorage.getItem("name") ?? "Anonymous"
    name_input.value = my_name
    
    socket.emit("name", name_input.value)

    name_input.addEventListener("input", () => {
        socket.emit("name", name_input.value)
        localStorage.setItem("name", name_input.value)
    })
}

/**
 * Shows the names of the editors in the document.
 * @param {Socket} socket
 */
function show_editor_names(socket) {
    socket.on("editor_names", (names) => {
        editor_names_display.innerText = names.join(", ")
    })
}

/**
 * Deletes the document.
 * @param {Socket} socket 
 */
function handle_delete(socket) {
    delete_button.addEventListener("click", () => {
        const sure = confirm("Are you sure you want to delete this document?")
        if (sure) socket.emit("delete")
    })

    socket.on("deleted", () => {
        display_deletion()
    })
}

function display_deletion() {
    remove_from_recent_docs();
    main_element.innerHTML = 
        "This document has been deleted. " +
        "You will be redirected to the home page in 3 seconds..."

    setTimeout(() => {
        window.location.href = "/"
    }, 3000)
}

/**
 * Enables the copy button to copy the URL of the document.
 */
function enable_copy_button() {
    copy_button.addEventListener("click", async () => {
        const url = window.location.href
        await navigator.clipboard.writeText(url)
        // window.alert("Copied URL to clipboard!")
        copy_button.classList.add("copied")
        setTimeout(() => {
            copy_button.classList.remove("copied")
        }, 2000)
    })
}

/**
 * Intermediate function which gets the word count of the text.
 * @param {string} text - The text to count the words of. 
 * @returns The word count
 */
function get_word_count(text) {
    const words = text.trim().split(/\s+/).filter(word => word != "")
    return words.length
}

/**
 * Displays the word count of the text.
 * @param {string} text 
 */
function display_word_count(text) {
    word_count_display.innerText = `${get_word_count(text)} words`
}

/**
 * @typedef {object} Doc_Recent
 * @property {string} id
 * @property {string} title
 */

/**
 * Returns the recent documents saved in local storage.
 * @returns {Doc_Recent[]}
 */
function get_recent_docs() {
    try {
        return JSON.parse(localStorage.getItem("recent_docs") ?? "[]")
    } catch (err) {
        console.error(err)
        return []
    }
}

/**
 * Adds the current document to list of recent documents.
 */
function add_to_recent_docs() {
    const id = get_doc_id()
    const title = document.title
    const recents = get_recent_docs()
    const others = recents.filter(doc => doc?.id != id)
    const updated = [{ id, title }, ...others].slice(0, 10)
    localStorage.setItem("recent_docs", JSON.stringify(updated))
}

/**
 * Removes the current document from recent documents.
 */
function remove_from_recent_docs() {
    const id = get_doc_id()
    const recents = get_recent_docs()
    const updated = recents.filter((doc) => doc?.id != id)
    localStorage.setItem("recent_docs", JSON.stringify(updated))
}