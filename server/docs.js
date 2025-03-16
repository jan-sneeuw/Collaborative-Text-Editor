import { doc_model } from "./model.js";

/**
 * @typedef {object} Doc - A document in the database
 * @property {string} title - The title of the document
 * @property {string} text - The text of the document
 * @property {string} public_id - The public ID of the document
 * @property {Date} createdAt - Date on which the document was created
 * @property {Date} updatedAt - Date on which the document was last updated 
 */

/**
 * @typedef {object} Doc_Error - An error that occured while accessing the document
 * @property {string} message - The error message
 * @property {number} status - The error status
 */


/**
 * Gets the document from the database and throws an error if document is not found.
 * @param {string} id - The public ID of the document. 
 * @returns {Promise<{doc: Doc, error: null} | {doc: null, error: Doc_Error}>}
 */
export async function get_doc(id) {
    try {
        const doc = await doc_model.findOne({public_id: id})
        if (doc) return {doc, error: null}
        console.error(`Could not find document with ID ${id}`)
        return {
            doc: null,
            error: { message: "No document found with that ID", status: 404 }
        }
    } catch(err) {
        console.error(`Could not get document with ID ${id}`)
        console.error(err)
        return {
            doc: null,
            error: { message: "Could not access document", status: 500 },
        }
    }
}

/**
 * Creates a document in the database.
 * @returns {Promise<{doc: Doc, error: null} | {doc: null, error: Doc_Error}>}
 */
export async function create_doc() {
    const doc = new doc_model()
    try {
        return {doc: await doc.save(), error: null}
    } catch(err) {
        console.error("Could not create document in database")
        console.error(err)
        return {
            doc: null,
            error: { message: "Could not create document", status: 500 },
        }
    }
}

/**
 * Updates the document in the database.
 * @param {string} id 
 * @param {Partial<Doc>} updates 
 * @returns {Promise<{doc: Doc, error: null} | {doc: null, error: Doc_Error}>}
 */
export async function update_doc(id, updates) {
    try {
        const doc = await doc_model.findOneAndUpdate({public_id: id}, updates, {new: true})
        if (doc) return {doc, error: null}

        console.error(`No document found with ID ${id}`)
        return {
            doc: null,
            error: {message: "No document found with that ID", status: 404}
        }
    } catch(err) {
        console.error(`Could not update document with ID ${id}`)
        console.error(err)
        return {
            doc: null,
            error: { message: "Could not update document", status: 500 },
        }
    }
}

/**
 * Deletes a document from the database.
 * @param {string} id - The ID of the document
 * @returns {Promise<{doc: Doc, error: null} | {doc: null, error: Doc_Error}>}
 */
export async function delete_doc(id) {
    try {
        const doc = await doc_model.findOneAndDelete({public_id: id})
        if (doc) return {doc, error: null}

        console.error(`No document found with ID ${id}`)
        return {
            doc: null,
            error: {message: "No document found with that ID", status: 404}
        }
    } catch(err) {
        console.error(`Could not delete document with ID ${id}`)
        console.error(err)
        return {
            doc: null,
            error: { message: "Could not delete document", status: 500 },
        }
    }
}

/**
 * Deletes documents from the database that have not been updated in the last year.
 */
export async function purge_old_docs(){
    const one_year_ago = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    try {
        const result = await doc_model.deleteMany({
            updatedAt: {$lt: one_year_ago}
        })
        console.log(`Deleted ${result.deletedCount} old documents`)
    } catch (err) {
        console.error("Could not delete old document!")
        console.error(err)
    }
}