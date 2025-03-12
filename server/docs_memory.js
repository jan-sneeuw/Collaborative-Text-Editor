/**
 * Documents saved in memory, i.e. a "local data base".
 * @typedef {object} Doc_memory
 * @property {string} id
 * @property {Record<string,string>} editors - first string = socket_id's, second string = names
 * @property {string | null} text_editor
 * @property {string | null} title_editor
 * @property {NodeJS.Timeout | null} text_timeout
 * @property {NodeJS.Timeout | null} title_timeout
 */

/**
 * The documents in memory, indexed by document ID.
 * @type {Record<string,Doc_memory>}
 */
const docs_memory = {}

/**
 * Gets the document (depending on ID) from memory.
 * @param {string} id 
 * @returns {Doc_memory | undefined} The document in memory, or undefined if it doesn't exist.
 */
export function get_doc_in_memory(id) {
    return docs_memory[id]
}

/**
 * Gets a document from memory, creating it if it doesn't exist.
 * @param {string} id 
 * @returns {Doc_memory}
 */
export function get_or_create_doc_in_memory(id) {
    const existing_doc = docs_memory[id]
    if (existing_doc) {
        return existing_doc
    }
    const doc_mem = {
        id,
        editors: {},
        text_editor: null,
        title_editor: null,
        text_timeout: null,
        title_timeout: null
    }
    docs_memory[id] = doc_mem
    return doc_mem
}

/**
 * Deletes a document from memory.
 * @param {string} id 
 */
export function delete_doc_from_memory(id) {
    delete docs_memory[id]
}