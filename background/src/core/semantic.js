// ? pipeline is a factory function, it automatically handles downloading the model, tokenizing the text, running model and formatting output
// ? env is global config obj
import { pipeline, env } from '@xenova/transformers';



env.useBrowserCache = false;
// env.useCustomCache = true;
// env.customCache = new CustomCache('transformers-cache');
env.allowLocalModels = false;

// ? Due to a bug in onnxruntime-web, we must disable multithreading for now.
// ? See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;

class EmbedPipeline {
    static task = 'feature-extraction';
    static model = 'Supabase/gte-small';
    static instance = null;

    static async getInstance() {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model);
        }
        return this.instance;
    }
}

// Function to convert text to vectors
export async function embed(text) {
    let embedder = await EmbedPipeline.getInstance();
    let result = await embedder(text, { pooling: 'mean', normalize: true });
    return result["data"];
}



export function cosineSimilarity(v1, v2) {
    if (v1.length !== v2.length) return -1;

    let dotProduct = 0;
    let v1_mag = 0;
    let v2_mag = 0;
    for (let i = 0; i < v1.length; i++) {
        dotProduct += v1[i] * v2[i];
        v1_mag += v1[i] ** 2;
        v2_mag += v2[i] ** 2;
    }
    return dotProduct / (Math.sqrt(v1_mag) * Math.sqrt(v2_mag));
}