# Remove Background

A Pixra plugin that removes image backgrounds using on-device AI.

## How it works

Uses the rembg-webgpu library to run an ONNX segmentation model directly in your browser. Processing happens locally - no images are uploaded to external servers.

The plugin automatically selects the best available backend:

- WebGPU with FP16 (fastest, requires compatible GPU)
- WebGPU with FP32
- WebAssembly (fallback for older browsers)

## Usage

1. Open an image in Pixra
2. Run "Remove Background" from the Tools menu
3. Wait for model download on first use (subsequent runs are faster)
4. The image updates in place with the background removed

## Requirements

- Modern browser with WebGPU or WebAssembly support
- Network access to download the AI model on first use (from Hugging Face)

## License

AGPL-3.0
