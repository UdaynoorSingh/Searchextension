'use strict';
import { embed, cosineSimilarity } from "./core/semantic";
import * as Constants from "./_lib/constants.js";

chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.storage.local.set(Constants.DEFAULT_SETTINGS);
    }
    else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        chrome.storage.local.get(null, (existingSettings) => {
            const newSettings = {
                ...Constants.DEFAULT_SETTINGS, ...existingSettings
            }
            chrome.storage.local.set(newSettings);
        });
    }
});


let globalEmbeddings = [];

// ! need to add logic where you check tab type and url and based on that take action
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "search-current-page") {
        chrome.tabs.sendMessage(tab.id, {
            target: "tab",
            action: "search-current-page"
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target === 'background') {
        switch (message.action) {
            case "show-error-delegation":
                chrome.tabs.sendMessage(message.oriSenderId, { target: "tab", action: "show-error", error: message.error });
                break;
            case "semantic-search-embed-content":
                (async () => {
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

                    sendResponse({ status: "embedded" });
                })();

                return true;
                break;

            case "semantic-search-query":
                (async () => {
                    const queryVector = await embed(message.query);
                    const resultsMap = new Map();

                    for (let nodeEmbedding of globalEmbeddings) {
                        for (let i = 0; i < nodeEmbedding.chunkVectors.length; i++) {
                            const score = cosineSimilarity(queryVector, nodeEmbedding.chunkVectors[i].vector);
                            console.log(score);
                            // Set your desired threshold here
                            if (score > 0.8) {
                                if (!resultsMap.has(nodeEmbedding.nodeIndex)) {
                                    resultsMap.set(nodeEmbedding.nodeIndex, []);
                                }
                                resultsMap.get(nodeEmbedding.nodeIndex).push(nodeEmbedding.chunkVectors[i].chunkIndex);
                            }
                        }
                    }

                    // Convert the Map to the requested array of objects format
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


