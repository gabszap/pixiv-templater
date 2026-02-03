// Pixiv Tag Translator
// Translates Pixiv tags to Danbooru tags using batched API requests
// Extracted and simplified from translate-pixiv-tags userscript

(function () {
    "use strict";

    // ============================
    // CONFIGURATION
    // ============================

    const CONFIG = {
        DANBOORU_API: "https://danbooru.donmai.us",
        CACHE_LIFETIME: 5 * 60 * 1000, // 5 minutes in ms
        BATCH_INTERVAL: 500, // ms between batch requests
        API_LIMIT: 1000,
        MAX_RETRIES: 3,
        RETRY_DELAY: 500, // ms
    };

    // ============================
    // CACHE
    // ============================

    /**
     * Translation cache
     * Key: normalized tag name
     * Value: { translations: TranslatedTag[], timestamp: number }
     * @type {Map<string, { translations: TranslatedTag[], timestamp: number }>}
     */
    const translationCache = new Map();

    /**
     * @typedef {Object} TranslatedTag
     * @property {string} name - Danbooru tag name
     * @property {string} prettyName - Human readable name (underscores replaced with spaces)
     * @property {number} category - Tag category (0=general, 1=artist, 3=copyright, 4=character, 5=meta)
     */

    /**
     * Check if a cached entry is still valid
     * @param {number} timestamp
     * @returns {boolean}
     */
    function isCacheValid(timestamp) {
        return Date.now() - timestamp < CONFIG.CACHE_LIFETIME;
    }

    /**
     * Get translation from cache if valid
     * @param {string} normalizedTag
     * @returns {TranslatedTag[] | null}
     */
    function getFromCache(normalizedTag) {
        const cached = translationCache.get(normalizedTag);
        if (cached && isCacheValid(cached.timestamp)) {
            return cached.translations;
        }
        return null;
    }

    /**
     * Save translation to cache
     * @param {string} normalizedTag
     * @param {TranslatedTag[]} translations
     */
    function saveToCache(normalizedTag, translations) {
        translationCache.set(normalizedTag, {
            translations,
            timestamp: Date.now(),
        });
    }

    // ============================
    // REQUEST QUEUE
    // ============================

    /**
     * @typedef {Object} PendingRequest
     * @property {string} normalizedTag
     * @property {string} originalTag
     * @property {(value: TranslatedTag[]) => void} resolve
     * @property {(reason: any) => void} reject
     */

    /** @type {PendingRequest[]} */
    const pendingRequests = [];

    /** @type {number | null} */
    let batchIntervalId = null;

    /**
     * Start the batch processing interval
     */
    function startBatchProcessor() {
        if (batchIntervalId !== null) return;

        batchIntervalId = setInterval(() => {
            if (pendingRequests.length > 0) {
                processBatchRequests();
            }
        }, CONFIG.BATCH_INTERVAL);

    }

    /**
     * Stop the batch processing interval
     */
    function stopBatchProcessor() {
        if (batchIntervalId !== null) {
            clearInterval(batchIntervalId);
            batchIntervalId = null;

        }
    }

    // ============================
    // TAG NORMALIZATION
    // ============================

    /**
     * Normalize a tag for API lookup
     * @param {string} tag
     * @returns {string}
     */
    function normalizeTag(tag) {
        return tag
            .normalize("NFKC")
            .replace(/^#/, "")
            .trim()
            .replace(/\s+/g, "_");
    }

    // ============================
    // DANBOORU API
    // ============================

    /**
     * Generate a unique request ID for message passing
     * @returns {string}
     */
    function generateRequestId() {
        return `danbooru_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Fetch via content script bridge (bypasses CORS)
     * @param {string} url - URL to fetch
     * @param {RequestInit} options - Fetch options
     * @returns {Promise<any>}
     */
    function fetchViaBridge(url, options = {}) {
        return new Promise((resolve, reject) => {
            const requestId = generateRequestId();

            const handler = (event) => {
                if (event.source !== window) return;
                const response = event.data;

                if (response.type === "PIXIV_TEMPLATER_FETCH_RESPONSE" && response.id === requestId) {
                    window.removeEventListener("message", handler);

                    if (response.success) {
                        resolve(response.data);
                    } else if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                    }
                }
            };

            window.addEventListener("message", handler);

            // Send request to content script
            window.postMessage({
                type: "PIXIV_TEMPLATER_FETCH",
                id: requestId,
                url: url,
                options: {
                    method: options.method || "GET",
                    headers: options.headers || {}
                }
            }, "*");

            // Timeout after 30 seconds
            setTimeout(() => {
                window.removeEventListener("message", handler);
                reject(new Error("Fetch bridge timeout"));
            }, 30000);
        });
    }

    /**
     * Make a request to Danbooru API
     * @param {string} endpoint
     * @param {Record<string, any>} params
     * @returns {Promise<any>}
     */
    async function fetchDanbooru(endpoint, params) {
        const url = new URL(`${CONFIG.DANBOORU_API}${endpoint}.json`);

        // Flatten nested objects for URLSearchParams
        const flattenParams = (obj, prefix = "") => {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}[${key}]` : key;
                if (
                    typeof value === "object" &&
                    value !== null &&
                    !Array.isArray(value)
                ) {
                    Object.assign(result, flattenParams(value, newKey));
                } else if (Array.isArray(value)) {
                    result[`${newKey}[]`] = value;
                } else {
                    result[newKey] = value;
                }
            }
            return result;
        };

        const flatParams = flattenParams(params);
        for (const [key, value] of Object.entries(flatParams)) {
            if (Array.isArray(value)) {
                value.forEach((v) => url.searchParams.append(key, v));
            } else {
                url.searchParams.set(key, String(value));
            }
        }

        for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
            try {
                // Use the bridge for CORS-free requests
                const data = await fetchViaBridge(url.toString(), {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                });

                return data;
            } catch (error) {
                console.warn(
                    `[TagTranslator] API request failed (attempt ${attempt + 1}/${CONFIG.MAX_RETRIES}):`,
                    error,
                );

                if (attempt < CONFIG.MAX_RETRIES - 1) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, CONFIG.RETRY_DELAY),
                    );
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Search wiki pages by other names (for Japanese → English translation)
     * Processes in small chunks to avoid URL size limits
     * @param {string[]} tags - Normalized tags to search
     * @returns {Promise<Map<string, TranslatedTag[]>>}
     */
    async function searchWikiPages(tags) {
        if (tags.length === 0) return new Map();

        /** @type {Map<string, TranslatedTag[]>} */
        const results = new Map();

        // Initialize all tags with empty arrays
        tags.forEach((tag) => results.set(tag.toLowerCase(), []));

        // Process in small chunks to avoid URL length issues (Cloudflare blocks long URLs)
        const CHUNK_SIZE = 10; // Max tags per request

        for (let i = 0; i < tags.length; i += CHUNK_SIZE) {
            const chunk = tags.slice(i, i + CHUNK_SIZE);

            try {
                const response = await fetchDanbooru("/wiki_pages", {
                    search: {
                        other_names_include_any_lower_array: chunk,
                        is_deleted: false,
                    },
                    only: "title,other_names,tag[category]",
                    limit: CONFIG.API_LIMIT,
                });

                // Map responses to their original tags
                for (const wiki of response) {
                    if (!wiki.tag) continue;

                    const translation = {
                        name: wiki.title,
                        prettyName: wiki.title.replace(/_/g, " "),
                        category: wiki.tag.category,
                    };

                    // Find which of our requested tags match this wiki's other_names
                    for (const otherName of wiki.other_names || []) {
                        const normalizedOther = otherName.toLowerCase();
                        if (results.has(normalizedOther)) {
                            const existing = results.get(normalizedOther);
                            // Avoid duplicates
                            if (!existing.some((t) => t.name === translation.name)) {
                                existing.push(translation);
                            }
                        }
                    }
                }

                // Small delay between chunks to avoid rate limiting
                if (i + CHUNK_SIZE < tags.length) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error(`[TagTranslator] Wiki pages search failed for chunk ${i}-${i + CHUNK_SIZE}:`, error);
            }
        }

        return results;
    }

    /**
     * Search direct tag matches (for ASCII tags)
     * @param {string[]} tags - Normalized tags to search
     * @returns {Promise<Map<string, TranslatedTag[]>>}
     */
    async function searchDirectTags(tags) {
        if (tags.length === 0) return new Map();

        try {
            const response = await fetchDanbooru("/tags", {
                search: {
                    name_lower_comma: tags.join(","),
                },
                only: "name,category,post_count",
                limit: CONFIG.API_LIMIT,
            });

            /** @type {Map<string, TranslatedTag[]>} */
            const results = new Map();

            for (const tag of response) {
                if (tag.post_count <= 0) continue;

                const normalizedName = tag.name.toLowerCase();
                const translation = {
                    name: tag.name,
                    prettyName: tag.name.replace(/_/g, " "),
                    category: tag.category,
                };

                if (!results.has(normalizedName)) {
                    results.set(normalizedName, []);
                }
                results.get(normalizedName).push(translation);
            }

            return results;
        } catch (error) {
            console.error("[TagTranslator] Direct tags search failed:", error);
            return new Map();
        }
    }

    /**
     * Search tag aliases
     * @param {string[]} tags - Normalized tags to search
     * @returns {Promise<Map<string, TranslatedTag[]>>}
     */
    async function searchTagAliases(tags) {
        if (tags.length === 0) return new Map();

        try {
            const response = await fetchDanbooru("/tag_aliases", {
                search: {
                    antecedent_name_lower_comma: tags.join(","),
                },
                only: "antecedent_name,consequent_tag[name,category,post_count]",
                limit: CONFIG.API_LIMIT,
            });

            /** @type {Map<string, TranslatedTag[]>} */
            const results = new Map();

            for (const alias of response) {
                if (!alias.consequent_tag) continue;

                const normalizedName = alias.antecedent_name.toLowerCase();
                const translation = {
                    name: alias.consequent_tag.name,
                    prettyName: alias.consequent_tag.name.replace(/_/g, " "),
                    category: alias.consequent_tag.category,
                };

                if (!results.has(normalizedName)) {
                    results.set(normalizedName, []);
                }
                results.get(normalizedName).push(translation);
            }

            return results;
        } catch (error) {
            console.error("[TagTranslator] Tag aliases search failed:", error);
            return new Map();
        }
    }

    // ============================
    // BATCH PROCESSING
    // ============================

    /**
     * Check if a tag is ASCII-only (can be searched directly)
     * @param {string} tag
     * @returns {boolean}
     */
    function isAsciiTag(tag) {
        // ASCII printable characters except %, *, and comma
        return /^[\u0020-\u0024\u0026-\u0029+\u002D-\u007F]+$/.test(tag);
    }

    /**
     * Process all pending requests in a batch
     */
    async function processBatchRequests() {
        if (pendingRequests.length === 0) return;

        // Take all current pending requests
        const batch = pendingRequests.splice(0, pendingRequests.length);


        // Separate tags by type
        const wikiTags = [];
        const asciiTags = [];

        for (const req of batch) {
            if (isAsciiTag(req.normalizedTag)) {
                asciiTags.push(req.normalizedTag);
            } else {
                wikiTags.push(req.normalizedTag);
            }
        }

        try {
            // Fetch translations in parallel
            const [wikiResults, directResults] = await Promise.all([
                searchWikiPages(wikiTags),
                searchDirectTags(asciiTags),
            ]);

            // For ASCII tags without direct matches, try aliases
            const missingAscii = asciiTags.filter(
                (tag) => !directResults.has(tag) || directResults.get(tag).length === 0,
            );

            let aliasResults = new Map();
            if (missingAscii.length > 0) {
                aliasResults = await searchTagAliases(missingAscii);
            }

            // Merge alias results into direct results
            for (const [tag, translations] of aliasResults) {
                if (!directResults.has(tag) || directResults.get(tag).length === 0) {
                    directResults.set(tag, translations);
                }
            }

            // Resolve all promises
            for (const req of batch) {
                const normalizedLower = req.normalizedTag.toLowerCase();

                let translations = [];
                if (wikiResults.has(normalizedLower)) {
                    translations = wikiResults.get(normalizedLower);
                } else if (directResults.has(normalizedLower)) {
                    translations = directResults.get(normalizedLower);
                }

                // Cache the result
                saveToCache(req.normalizedTag, translations);

                // Resolve the promise
                req.resolve(translations);
            }
        } catch (error) {
            console.error("[TagTranslator] Batch processing failed:", error);

            // Reject all promises in the batch
            for (const req of batch) {
                req.reject(error);
            }
        }
    }

    // ============================
    // PUBLIC API
    // ============================

    /**
     * Queue a single tag for translation
     * @param {string} tag - Original tag
     * @returns {Promise<TranslatedTag[]>}
     */
    function queueTagTranslation(tag) {
        const normalizedTag = normalizeTag(tag);

        // Check cache first
        const cached = getFromCache(normalizedTag);
        if (cached !== null) {
            return Promise.resolve(cached);
        }

        // Check if already in queue
        const existing = pendingRequests.find(
            (r) => r.normalizedTag === normalizedTag,
        );
        if (existing) {
            // Return a new promise that resolves when the existing one does
            return new Promise((resolve, reject) => {
                const originalResolve = existing.resolve;
                const originalReject = existing.reject;

                existing.resolve = (value) => {
                    originalResolve(value);
                    resolve(value);
                };
                existing.reject = (reason) => {
                    originalReject(reason);
                    reject(reason);
                };
            });
        }

        // Add to queue
        return new Promise((resolve, reject) => {
            pendingRequests.push({
                normalizedTag,
                originalTag: tag,
                resolve,
                reject,
            });

            // Start processor if not running
            startBatchProcessor();
        });
    }

    /**
     * Translate multiple tags
     * @param {string[]} tags - Array of original tags
     * @returns {Promise<Map<string, TranslatedTag[]>>} Map of original tag → translations
     */
    async function translateTags(tags) {
        const uniqueTags = [...new Set(tags)];

        const translationPromises = uniqueTags.map(async (tag) => {
            const translations = await queueTagTranslation(tag);
            return { original: tag, translations };
        });

        const results = await Promise.all(translationPromises);

        /** @type {Map<string, TranslatedTag[]>} */
        const translationMap = new Map();
        for (const { original, translations } of results) {
            translationMap.set(original, translations);
        }

        return translationMap;
    }

    /**
     * Translate a single tag
     * @param {string} tag - Original tag
     * @returns {Promise<TranslatedTag[]>}
     */
    async function translateTag(tag) {
        return queueTagTranslation(tag);
    }

    /**
     * Clear the translation cache
     */
    function clearCache() {
        translationCache.clear();
        console.log("[TagTranslator] Cache cleared");
    }

    /**
     * Get cache statistics
     * @returns {{ size: number, validEntries: number }}
     */
    function getCacheStats() {
        let validEntries = 0;
        for (const [, value] of translationCache) {
            if (isCacheValid(value.timestamp)) {
                validEntries++;
            }
        }
        return {
            size: translationCache.size,
            validEntries,
        };
    }

    // ============================
    // EXPOSE PUBLIC API
    // ============================

    window.PixivTagTranslator = {
        // Main translation functions
        translateTags,
        translateTag,

        // Cache management
        clearCache,
        getCacheStats,

        // Lifecycle
        startBatchProcessor,
        stopBatchProcessor,

        // Utilities
        normalizeTag,

        // Configuration (read-only)
        get config() {
            return { ...CONFIG };
        },
    };

})();
