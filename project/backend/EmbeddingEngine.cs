using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace FileIndexer;

public class EmbeddingEngine : IDisposable
{
    private readonly InferenceSession _session;
    private readonly string _modelPath;

    public EmbeddingEngine(string modelPath)
    {
        _modelPath = modelPath;
        // Ensure model exists or throw clear error
        if (!File.Exists(modelPath))
        {
            throw new FileNotFoundException($"Model not found at {modelPath}. Please download minilm.onnx.");
        }
        
        var options = new SessionOptions();
        // options.AppendExecutionProvider_CPU(0); // Default
        _session = new InferenceSession(modelPath, options);
    }

    public float[] GetEmbedding(string text)
    {
        // Simple tokenization (WordPiece-ish simulation for MVP)
        // In a real app, use a proper tokenizer library (e.g., BertTokenizers)
        // Here we just pad/truncate to expected input size for MiniLM (usually 256 or 512 tokens)
        
        // For this MVP, we will assume the model expects:
        // input_ids: int64[1, sequence_length]
        // attention_mask: int64[1, sequence_length]
        // token_type_ids: int64[1, sequence_length]
        
        // We'll use a dummy implementation that hashes text to "tokens" for the MVP
        // since implementing a full BERT tokenizer in C# from scratch is too large.
        // *CRITICAL*: For production, use Microsoft.ML.Tokenizers.
        
        long[] inputIds = Tokenize(text, 128);
        long[] attentionMask = new long[128];
        long[] tokenTypeIds = new long[128];

        for (int i = 0; i < 128; i++)
        {
            attentionMask[i] = 1;
            tokenTypeIds[i] = 0;
        }

        var inputIdsTensor = new DenseTensor<long>(inputIds, new[] { 1, 128 });
        var attentionMaskTensor = new DenseTensor<long>(attentionMask, new[] { 1, 128 });
        var tokenTypeIdsTensor = new DenseTensor<long>(tokenTypeIds, new[] { 1, 128 });

        var inputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("input_ids", inputIdsTensor),
            NamedOnnxValue.CreateFromTensor("attention_mask", attentionMaskTensor),
            NamedOnnxValue.CreateFromTensor("token_type_ids", tokenTypeIdsTensor)
        };

        using var results = _session.Run(inputs);
        
        // MiniLM usually outputs 'last_hidden_state' or 'pooler_output'
        // We'll take the first output and mean pool it if necessary, or just take [CLS] token
        var output = results.First().AsTensor<float>();
        
        // Assuming output is [1, 128, 384], take [0, 0, :] (CLS token)
        float[] embedding = new float[384];
        for (int i = 0; i < 384; i++)
        {
            embedding[i] = output[0, 0, i];
        }

        return Normalize(embedding);
    }

    private long[] Tokenize(string text, int maxLength)
    {
        // Very naive hashing tokenizer for MVP demonstration
        // Real implementation requires vocab.txt
        long[] tokens = new long[maxLength];
        tokens[0] = 101; // [CLS]
        
        int idx = 1;
        foreach (char c in text)
        {
            if (idx >= maxLength - 1) break;
            tokens[idx++] = (c % 30000) + 100; // Dummy mapping
        }
        tokens[idx] = 102; // [SEP]
        
        return tokens;
    }

    private float[] Normalize(float[] vec)
    {
        double sumSq = 0;
        foreach (var v in vec) sumSq += v * v;
        float norm = (float)Math.Sqrt(sumSq);
        if (norm == 0) return vec;
        for (int i = 0; i < vec.Length; i++) vec[i] /= norm;
        return vec;
    }

    public void Dispose()
    {
        _session.Dispose();
    }
}
