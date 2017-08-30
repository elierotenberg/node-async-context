let _nextObjectId = 0;
const _objectIdMemo = new WeakMap();
const objectId = obj => {
  if (!_objectIdMemo.has(obj)) {
    _objectIdMemo.set(obj, _nextObjectId++);
  }
  return _objectIdMemo.get(obj);
};

module.exports = objectId;
