class FlowVoiceCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.flushThreshold = 1024;
    this.maxBlocksPerFlush = 6;
    this.buffer = new Float32Array(this.flushThreshold * 2);
    this.bufferedLength = 0;
    this.pendingBlocks = 0;
  }

  flush() {
    if (this.bufferedLength <= 0) {
      return;
    }

    const chunk = new Float32Array(this.bufferedLength);
    chunk.set(this.buffer.subarray(0, this.bufferedLength));
    this.bufferedLength = 0;
    this.pendingBlocks = 0;
    this.port.postMessage(chunk, [chunk.buffer]);
  }

  process(inputs, outputs) {
    const inputChannel = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (outputChannel) {
      outputChannel.fill(0);
    }

    if (inputChannel && inputChannel.length > 0) {
      if (this.bufferedLength + inputChannel.length > this.buffer.length) {
        this.flush();
      }

      this.buffer.set(inputChannel, this.bufferedLength);
      this.bufferedLength += inputChannel.length;
      this.pendingBlocks += 1;

      if (this.bufferedLength >= this.flushThreshold || this.pendingBlocks >= this.maxBlocksPerFlush) {
        this.flush();
      }
    } else if (this.bufferedLength > 0) {
      this.flush();
    }

    return true;
  }
}

registerProcessor("flow-voice-capture", FlowVoiceCaptureProcessor);