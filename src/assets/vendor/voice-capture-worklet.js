class FlowVoiceCaptureProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const inputChannel = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (outputChannel) {
      outputChannel.fill(0);
    }

    if (inputChannel && inputChannel.length > 0) {
      const copy = new Float32Array(inputChannel.length);
      copy.set(inputChannel);
      this.port.postMessage(copy, [copy.buffer]);
    }

    return true;
  }
}

registerProcessor("flow-voice-capture", FlowVoiceCaptureProcessor);