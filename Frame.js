class Frame {
  constructor(
    frameId,
    parentFrameId = null,
    type = null,
    creationTime = null,
    label = null,
  ) {
    this.frameId = frameId;
    this.parentFrameId = parentFrameId;
    this.type = type;
    this.creationTime = creationTime;
    this.label = label;
  }
}

module.exports = Frame;
