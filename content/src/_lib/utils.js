// ? Our highlighter logic needs to know exact index so we cannot just trim something inside chunk as it will cause miss matching
function splitByChars(text, numChars) {
    let chunks = [];
    let currChunk = '';
    const sentenceEndings = ['.', '?', '!', ';', ':', '\n', '–'];

    for (let i = 0; i < text.length; i++) {
        currChunk += text[i];

        let isEndingPunctuation = sentenceEndings.includes(text[i]);

        // ? Special case: if the punctuation is a period and the next character is a quote 
        // ?  If i+1 == text.length then text[i+1] will simply evaluate to undefined
        if (text[i] === '.' && text[i + 1] === '"') {
            currChunk += text[++i];
            isEndingPunctuation = true;
        }

        // * Normally this was currChunk.trim().length; and chunks.push(currChunk.trim());
        if (currChunk.length >= numChars && isEndingPunctuation) {
            chunks.push(currChunk);
            currChunk = '';
        }
    }

    if (currChunk) {
        chunks.push(currChunk);
    }

    return chunks;
}


export function splitReadableContent(readableContent, numChars = 50) {
    return splitByChars(readableContent, numChars);
}


export function getCacheKeyUrl(currentHref) {
    try {
        const url = new URL(currentHref);
        
        // ? Remove the hash (anchor tags)
        url.hash = ''; 
        
        // ? Remove common analytics/tracking parameters
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 
            'utm_content', 'fbclid', 'gclid', 'ref'
        ];
        trackingParams.forEach(param => url.searchParams.delete(param));
        
        // ? Remove trailing slashes for consistency
        return url.toString().replace(/\/$/, '');
        
    } catch (e) {
        // Fallback 
        return currentHref.split('#')[0]; 
    }
}