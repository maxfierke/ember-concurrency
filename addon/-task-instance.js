import Ember from 'ember';
import { createObservable } from './utils';

export function Cancelation() {}

function forwardToInternalPromise(method) {
  return function(...args) {
    return this.promise[method](...args);
  };
}

export default Ember.Object.extend({
  iterator: null,
  isCanceled: false,
  hasStarted: false,

  _index: 1,
  isIdle: false,

  init() {
    this._super();
    this._defer = Ember.RSVP.defer();
    this.promise = this._defer.promise;
    this.iterator = this.fn.apply(this.context, this.args);

    Ember.RSVP.resolve(this.startAfter).then(() => {
      if (this.isCanceled) { return; }

      this.set('hasStarted', true);
      this._proceed(1, undefined);
    }).catch(() => {
      this._rejectWithCancelation();
    });
  },

  cancel() {
    if (this.isCanceled) { return; }
    this._rejectWithCancelation();

    // eagerly advance index so that pending promise resolutions
    // are ignored
    this._index++;
    this._proceed(this._index, undefined);
  },

  then:    forwardToInternalPromise('then'),
  catch:   forwardToInternalPromise('catch'),
  finally: forwardToInternalPromise('finally'),

  _rejectWithCancelation() {
    if (this.isCanceled) { return; }
    this._reject(new Cancelation());
    this.set('isCanceled', true);
  },

  _reject(error) {
    this._defer.reject(error);
  },

  _defer: null,
  promise: null,

  _proceed(index, nextValue) {
    Ember.run.once(this, this._takeStep, index, nextValue);
  },

  _takeSafeStep(nextValue, iteratorMethod) {
    try {
      return this.iterator[iteratorMethod](nextValue);
    } catch(e) {
      return { value: e, error: true };
    }
  },

  _hasBegunShutdown: false,

  _hasResolved: false,

  _takeStep(index, nextValue) {
    if (index !== this._index) { return; }

    let result;
    if (this.isCanceled && !this._hasBegunShutdown) {
      this._hasBegunShutdown = true;
      result = this._takeSafeStep(nextValue, 'return');
    } else {
      result = this._takeSafeStep(nextValue, 'next');
    }

    let { done, value, error } = result;

    if (error) {
      this.set('isIdle', true);
      this._defer.reject(value);
      return;
    } else {
      if (done && value === undefined) {
        this.set('isIdle', true);
        this._defer.resolve(nextValue);
        return;
      }
    }

    let observable = normalizeObservable(value);
    if (!observable) {
      // TODO: assert that user is doing something weird?
      this._proceed(index, value);
      return;
    }

    let disposable = observable.subscribe(v => {
      this._proceed(index, v);
    }, error => {
      Ember.assert("not implemented yet", false);
    }, () => {
      // TODO: test me
      //opsIterator.proceed(index, NEXT, null); // replace with "no value" token?
    });
  },
});

function normalizeObservable(value) {
  if (value && typeof value.then === 'function') {
    return createObservable(publish => {
      value.then(publish, publish.error);
    });
  } else if (value && typeof value.subscribe === 'function') {
    // TODO: check for scheduler interface for Rx rather than
    // creating another wrapping observable to schedule on run loop.
    return createObservable(publish => {
      return value.subscribe(publish, publish.error).dispose;
    });
  } else {
    return null;
  }
}

