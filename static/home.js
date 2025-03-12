/**
 * The button to clear the recent documents.
 */
const clear_button = /** @type {HTMLButtonElement} */ (
    document.getElementById("clear_btn")
)

/**
 * The element to display the recent documents.
 */
const recent_docs_display = /** @type {HTMLElement} */ (
    document.getElementById("recent_docs")
)

const recent_docs_list = /** @type {HTMLUListElement} */ (
    recent_docs_display.querySelector("ul")
)

/**
 * @typedef {import("./client.js").Doc_Recent} Doc_Recent
 */

/**
 * Initializes the homepage by displaying the recent documents.
 */
function init() {
    const recent_docs = get_recent_docs()
    display_recent_docs(recent_docs)
    clear_button.addEventListener("click", clear_recent_docs)
}

init()

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
 * Actually displays the recent documents on the homepage.
 * @param {Doc_Recent[]} recent_docs
 */
function display_recent_docs(recent_docs) {
    if (recent_docs.length === 0) return
    recent_docs_display.removeAttribute("hidden")
    recent_docs_list.innerHTML = ""
    for (const doc of recent_docs) {
        const valid = typeof doc === "object" && "id" in doc && "title" in doc
        if (!valid) continue
        const li = document.createElement("li")
        const link = document.createElement("a")
        link.href = `/document/${doc.id}`
        link.innerText = doc.title
        li.appendChild(link)
        recent_docs_list.appendChild(li)
    }
}

/**
 * Clears the recent documents from local storage.
 */
function clear_recent_docs() {
    localStorage.removeItem("recent_docs")
    recent_docs_display.setAttribute("hidden", "")
    recent_docs_list.innerHTML = ""
}