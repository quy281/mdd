import pb from './pb.js'
import { idbGet, idbSet, idbDel } from './idb.js'

const LS_PROJECTS = 'hoso_ls_projects'
const LS_DOCS = 'hoso_ls_documents'
const LS_ANNOTATIONS = 'hoso_ls_annotations'

let _lastPBSuccess = 0

function withTimeout(promise, ms) {
    const timeout = (Date.now() - _lastPBSuccess < 15000) ? ms * 2 : ms
    return Promise.race([
        promise,
        new Promise((_, rej) =>
            setTimeout(() => rej(new Error('PocketBase timeout')), timeout)
        ),
    ])
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────

export async function getProjects() {
    try {
        const [projResult, docResult] = await withTimeout(
            Promise.all([
                pb.collection('hoso_projects').getList(1, 500),
                pb.collection('hoso_documents').getList(1, 500),
            ]),
            8000
        )
        _lastPBSuccess = Date.now()
        const docs = docResult.items
        const projects = projResult.items.map((p) => ({
            ...p,
            documents: docs.filter((d) => d.project_id === p.id),
        }))
        await idbSet(LS_PROJECTS, projects)
        await idbSet(LS_DOCS, docs)
        return projects
    } catch (err) {
        console.warn('PB offline, using IDB cache:', err.message)
        const cached = await idbGet(LS_PROJECTS)
        return cached || []
    }
}

export async function createProject(name) {
    const record = await pb.collection('hoso_projects').create({ name })
    // Invalidate cache
    const cached = (await idbGet(LS_PROJECTS)) || []
    await idbSet(LS_PROJECTS, [{ ...record, documents: [] }, ...cached])
    return record
}

export async function deleteProject(id) {
    // Delete all docs + annotations first
    const docsResult = await pb.collection('hoso_documents').getList(1, 500, {
        filter: `project_id = "${id}"`,
    })
    for (const doc of docsResult.items) {
        await deleteDocument(id, doc.id)
    }
    await pb.collection('hoso_projects').delete(id)
    const cached = (await idbGet(LS_PROJECTS)) || []
    await idbSet(LS_PROJECTS, cached.filter((p) => p.id !== id))
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────

export async function saveDocument(projectId, fileName, content, type) {
    const data = { project_id: projectId, fileName, content, type }
    const record = await pb.collection('hoso_documents').create(data)
    // Write-through to IDB
    const cached = (await idbGet(LS_DOCS)) || []
    await idbSet(LS_DOCS, [record, ...cached])
    return record
}

export async function updateDocument(docId, content) {
    const record = await pb.collection('hoso_documents').update(docId, { content })
    // Write-through to IDB
    const cached = (await idbGet(LS_DOCS)) || []
    await idbSet(LS_DOCS, cached.map((d) => (d.id === docId ? record : d)))
    return record
}

export async function deleteDocument(projectId, docId) {
    // Delete annotations first
    const annResult = await pb.collection('hoso_annotations').getList(1, 500, {
        filter: `document_id = "${docId}"`,
    })
    for (const ann of annResult.items) {
        await pb.collection('hoso_annotations').delete(ann.id)
    }
    await pb.collection('hoso_documents').delete(docId)
    const cached = (await idbGet(LS_DOCS)) || []
    await idbSet(LS_DOCS, cached.filter((d) => d.id !== docId))
}

// ─── ANNOTATIONS ─────────────────────────────────────────────────────────────

export async function getAnnotations(docId) {
    try {
        const result = await withTimeout(
            pb.collection('hoso_annotations').getList(1, 500, {
                filter: `document_id = "${docId}"`,
            }),
            4000
        )
        _lastPBSuccess = Date.now()
        const items = result.items
        // Update cache
        const cached = (await idbGet(LS_ANNOTATIONS)) || []
        const others = cached.filter((a) => a.document_id !== docId)
        await idbSet(LS_ANNOTATIONS, [...items, ...others])
        return items
    } catch (err) {
        console.warn('PB offline (annotations), using IDB:', err.message)
        const cached = (await idbGet(LS_ANNOTATIONS)) || []
        return cached.filter((a) => a.document_id === docId)
    }
}

export async function getAllAnnotations() {
    try {
        const result = await withTimeout(
            pb.collection('hoso_annotations').getList(1, 1000),
            6000
        )
        _lastPBSuccess = Date.now()
        await idbSet(LS_ANNOTATIONS, result.items)
        return result.items
    } catch (err) {
        const cached = (await idbGet(LS_ANNOTATIONS)) || []
        return cached
    }
}

export async function saveAnnotation(data) {
    const record = await pb.collection('hoso_annotations').create(data)
    const cached = (await idbGet(LS_ANNOTATIONS)) || []
    await idbSet(LS_ANNOTATIONS, [record, ...cached])
    return record
}

export async function updateAnnotation(id, data) {
    const record = await pb.collection('hoso_annotations').update(id, data)
    const cached = (await idbGet(LS_ANNOTATIONS)) || []
    await idbSet(LS_ANNOTATIONS, cached.map((a) => (a.id === id ? record : a)))
    return record
}

export async function deleteAnnotation(id) {
    await pb.collection('hoso_annotations').delete(id)
    const cached = (await idbGet(LS_ANNOTATIONS)) || []
    await idbSet(LS_ANNOTATIONS, cached.filter((a) => a.id !== id))
}

// ─── REALTIME ────────────────────────────────────────────────────────────────

export function subscribeToChanges(onUpdate) {
    let unsubs = []
    const collections = ['hoso_projects', 'hoso_documents', 'hoso_annotations']
    collections.forEach((col) => {
        pb.collection(col)
            .subscribe('*', () => {
                // Invalidate IDB cache and notify
                idbDel(LS_PROJECTS)
                onUpdate()
            })
            .then((unsub) => unsubs.push(unsub))
            .catch(console.warn)
    })
    return () => unsubs.forEach((fn) => typeof fn === 'function' && fn())
}
