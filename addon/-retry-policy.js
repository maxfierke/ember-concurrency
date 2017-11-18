import { isArray } from "@ember/array";
import { assert } from '@ember/debug';
import { cancel, later } from '@ember/runloop';
import { YIELDABLE_CONTINUE } from './utils';
import { get, set } from "@ember/object";

export const RETRY_TIMER = '__ec_retry_timer';

export class DelayBackOffPolicy {
  constructor({ delay = [], reasons = [] }) {
    this.delay = delay;
    this.reasons = reasons;
    this.retryAttempt = 0;
    this._retryTimer = null;

    assert("The `delay` argument must be a Number or an array of Numbers representing milliseconds", typeof this.delay === 'number' || isArray(this.delay));
    assert("The `reasons` argument must be an array of potentially caught errors", isArray(this.reasons));
  }

  shouldRetry(taskInstance, reason) {
    let retryAttempt = get(taskInstance, 'retryCount');
    let hasDelay = retryAttempt < this.delay.length;

    if (this.reasons.length > 0) {
      let reasonIsValid = this.reasons
        .any((r) => r === reason || reason instanceof r);

      return hasDelay && reasonIsValid;
    }

    return hasDelay;
  }

  retry(taskInstance) {
    let retryCount = get(taskInstance, 'retryCount');
    let currentDelayMs = this.delay[retryCount];
    let retryTimer = later(() => {
      taskInstance._scheduleProceed(YIELDABLE_CONTINUE, null);
    }, currentDelayMs);

    taskInstance.incrementProperty('retryCount');
    set(taskInstance, 'isRetrying', true);
    set(taskInstance, RETRY_TIMER, retryTimer);
  }

  reset(taskInstance) {
    this.cancel(taskInstance);
    set(taskInstance, 'isRetrying', false);
  }

  cancel(taskInstance) {
    let retryTimer = get(taskInstance, RETRY_TIMER);
    if (retryTimer) {
      cancel(retryTimer);
    }
  }
}

export class NoOpRetryPolicy {
  shouldRetry() { return false; }
  retry() {}
  reset() {}
  cancel() {}
}

export const noopRetryPolicy = new NoOpRetryPolicy();
