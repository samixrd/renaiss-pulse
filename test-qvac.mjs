import { loadModel, completion, unloadModel, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: (usage.rss / 1024 / 1024).toFixed(2) + " MB",
    heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
    external: (usage.external / 1024 / 1024).toFixed(2) + " MB",
  };
}

async function run() {
  console.log("=== QVAC SDK Standalone Node.js Test ===");
  console.log("Initial memory usage:", getMemoryUsage());

  const startTime = Date.now();
  console.log("\nLoading model LLAMA_3_2_1B_INST_Q4_0...");
  
  let modelId;
  try {
    // Add a 600-second (10-minute) overall timeout to prevent hanging forever
    const timeoutTimer = setTimeout(() => {
      console.error("\n[ERROR] Test run exceeded 600-second timeout. Terminating process.");
      process.exit(1);
    }, 600000);
    timeoutTimer.unref();

    let lastLoggedPct = -1;
    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      modelType: "llm",
      onProgress: (progressObj) => {
        if (progressObj && typeof progressObj === "object") {
          const percentage = progressObj.percentage;
          const downloaded = progressObj.downloaded;
          const total = progressObj.total;
          if (percentage !== undefined && percentage !== null) {
            // Only log every 5% to reduce noise
            const pctBucket = Math.floor(percentage / 5) * 5;
            if (pctBucket > lastLoggedPct) {
              lastLoggedPct = pctBucket;
              const downloadedMB = (downloaded / 1024 / 1024).toFixed(1);
              const totalMB = (total / 1024 / 1024).toFixed(1);
              console.log(`Download/Load progress: ${percentage.toFixed(1)}% (${downloadedMB}MB / ${totalMB}MB)`);
            }
          } else {
            console.log("Progress details:", JSON.stringify(progressObj));
          }
        }
      }
    });
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Model loaded successfully in ${loadTime}s. Model ID: ${modelId}`);
    console.log("Memory usage after loading model:", getMemoryUsage());
  } catch (err) {
    console.error("Failed to load model:", err);
    process.exit(1);
  }

  const prompt = "Reserve 50 USDt for tickets";
  console.log(`\nRunning inference for prompt: "${prompt}"`);
  
  const inferenceStartTime = Date.now();
  let firstTokenTime = null;
  let tokenCount = 0;
  let fullResponse = "";

  try {
    const result = completion({
      modelId,
      history: [
        { role: "user", content: prompt }
      ],
      stream: true
    });

    for await (const token of result.tokenStream) {
      if (firstTokenTime === null) {
        firstTokenTime = Date.now();
      }
      tokenCount++;
      fullResponse += token;
      process.stdout.write(token);
    }
    console.log("\n");

    const totalInferenceTime = Date.now() - inferenceStartTime;
    const timeToFirstToken = firstTokenTime ? (firstTokenTime - inferenceStartTime) : null;
    const genTime = firstTokenTime ? (Date.now() - firstTokenTime) : totalInferenceTime;
    const tokensPerSec = genTime > 0 ? (tokenCount / (genTime / 1000)).toFixed(2) : "N/A";

    console.log("=== Inference Metrics ===");
    console.log(`Response: ${fullResponse}`);
    console.log(`Time to first token: ${timeToFirstToken ? (timeToFirstToken / 1000).toFixed(2) + "s" : "N/A"}`);
    console.log(`Total generation time: ${(totalInferenceTime / 1000).toFixed(2)}s`);
    console.log(`Tokens generated: ${tokenCount}`);
    console.log(`Tokens per second: ${tokensPerSec}`);
    console.log("Memory usage during inference:", getMemoryUsage());
  } catch (err) {
    console.error("Failed during inference:", err);
  }

  console.log("\nUnloading model...");
  try {
    await unloadModel({ modelId });
    console.log("Model unloaded successfully.");
    console.log("Memory usage after unloading:", getMemoryUsage());
  } catch (err) {
    console.error("Failed to unload model:", err);
  }
}

run().catch(console.error);
