'use strict';
import "./core/install.js";
import "./core/rating.js";
import "./core/contextMenu.js";

import * as Constants from "./_lib/constants.js";
import { embed, cosineSimilarity } from "./core/semantic/semantic.js";
import { BertForMaskedLM } from "@xenova/transformers";
import { getPreference } from "./_lib/utils.js";




let globalEmbeddings = [];

// ! need to add logic where you check tab type and url and based on that take action
chrome.commands.onCommand.addListener(async (command, tab) => {
    const extensionOn = await getPreference("extensionOn");

    if (command === "search-current-page" && extensionOn) {
        chrome.tabs.sendMessage(tab.id, { target: "tab", action: "search-current-page" });
    }

    // ! Add action listen cmd as well for fallback
});



// Helper functions to save and load page embeddings
async function saveEmbeddingsToCache(url, embeddings) {
    const serializable = embeddings.map(node => ({
        ...node,
        chunkVectors: node.chunkVectors.map(cv => ({
            ...cv,
            vector: Array.from(cv.vector) // Convert Float32Array to standard Array for JSON serialization
        }))
    }));
    await chrome.storage.local.set({ [`embed_${url}`]: serializable });
}

async function loadEmbeddingsFromCache(url) {
    const data = await chrome.storage.local.get([`embed_${url}`]);
    const stored = data[`embed_${url}`];
    if (!stored) return null;

    return stored.map(node => ({
        ...node,
        chunkVectors: node.chunkVectors.map(cv => ({
            ...cv,
            vector: new Float32Array(cv.vector) // ? This is used because cosineSimilarity function has operations that are highly modified for float32arrays
        }))
    }));
}

async function removePageEmbeddingsFromCache(url) {
    const key = `embed_${url}`;
    await chrome.storage.local.remove(key);
    // console.log(`Removed embeddings for: ${url}`);
}

async function clearAllPageEmbeddings() {
    const allData = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(allData).filter(key => key.startsWith('embed_'));

    if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        // console.log(`Cleared ${keysToRemove.length} page embeddings.`);
    }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target === 'background') {
        switch (message.action) {
            case "show-error-delegation":
                if (message.delegateTo === "tab") {
                    chrome.tabs.sendMessage(message.oriSenderId, { target: "tab", action: "show-error", error: message.error });
                }

                break;

            case "semantic-search-embed-content":
                (async () => {
                    const pageUrl = message.url;

                    if (pageUrl) {
                        const cachedEmbeddings = await loadEmbeddingsFromCache(pageUrl);
                        if (cachedEmbeddings) {
                            globalEmbeddings = cachedEmbeddings;
                            sendResponse({ status: "embedded-from-cache" });
                            return;
                        }
                    }

                    globalEmbeddings = []; // ? clear previous search embeddings

                    for (let nodeChunksObj of message.nodeChunksObjs) {
                        const nodeEmbedding = {
                            nodeIndex: nodeChunksObj.nodeIndex,
                            chunkVectors: []
                        };

                        for (let c = 0; c < nodeChunksObj.chunks.length; c++) {
                            // ! Temp
                            if (nodeChunksObj.chunks[c].length < 30) {
                                continue;
                            }

                            const vector = await embed(nodeChunksObj.chunks[c]);
                            nodeEmbedding.chunkVectors.push({
                                chunkIndex: c,
                                vector: vector
                            });
                        }

                        globalEmbeddings.push(nodeEmbedding);
                    }

                    if (pageUrl) {
                        await saveEmbeddingsToCache(pageUrl, globalEmbeddings);
                    }
                    sendResponse({ status: "embedded" });
                })();

                return true;
                break;

            case "semantic-search-query":
                (async () => {
                    const queryVector = await embed(message.query);
                    const allScoredChunks = [];

                    // 1. Collect every single score
                    for (let nodeEmbedding of globalEmbeddings) {
                        for (let i = 0; i < nodeEmbedding.chunkVectors.length; i++) {
                            const score = cosineSimilarity(queryVector, nodeEmbedding.chunkVectors[i].vector);
                            allScoredChunks.push({
                                nodeIndex: nodeEmbedding.nodeIndex,
                                chunkIndex: nodeEmbedding.chunkVectors[i].chunkIndex,
                                score: score
                            });
                        }
                    }

                    // 2. Sort from highest score to lowest score
                    allScoredChunks.sort((a, b) => b.score - a.score);

                    // 3. Take only the top 5 results, AND ensure they meet a minimum strict baseline
                    const STRICT_BASELINE = 0.8;
                    const topResults = allScoredChunks.slice(0, 10).filter(item => item.score > STRICT_BASELINE);

                    // 4. Group back into your expected Map structure
                    const resultsMap = new Map();
                    for (let result of topResults) {
                        if (!resultsMap.has(result.nodeIndex)) {
                            resultsMap.set(result.nodeIndex, []);
                        }
                        resultsMap.get(result.nodeIndex).push(result.chunkIndex);
                    }

                    // 5. Convert Map to the final array format
                    const finalResults = [];
                    resultsMap.forEach((chunkIndices, nodeIndex) => {
                        finalResults.push({ nodeIndex, chunkIndices });
                    });

                    sendResponse(finalResults);
                })();

                return true;
                break;
            default:
                break;
        }
    }
});


chrome.action.onClicked.addListener(async (tab) => {
    const extensionOn = await getPreference("extensionOn");
    if (extensionOn) {
        chrome.tabs.sendMessage(tab.id, { target: "tab", action: "search-current-page" });
    }
});


