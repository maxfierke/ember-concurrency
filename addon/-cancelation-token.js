export class CancelationToken {
  constructor(canceled = false) {
    this._isCancelationRequested = canceled;
  }

  cancel() {
    this._isCancelationRequested = true;
  }

  get isCancelationRequested() {
    return this._isCancelationRequested;
  }
}

export class EmberObjectCancelationToken extends CancelationToken {
  constructor(obj, canceled = false) {
    super(canceled);
    this._obj = obj;
  }

  get isCancelationRequested() {
    return this._obj.isDestroying || this._obj.isDestroyed || super.isCancelationRequested;
  }
}
