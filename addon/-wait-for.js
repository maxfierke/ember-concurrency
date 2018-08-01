import { assert } from '@ember/debug';
import { schedule } from '@ember/runloop';
import { get } from '@ember/object';

import { isEventedObject, yieldableToPromise } from './utils';

import {
  yieldableSymbol,
  YIELDABLE_CONTINUE
} from './utils';

class WaitFor {
  then(...args) {
    return yieldableToPromise(this).then(...args);
  }
}

class WaitForQueueYieldable extends WaitFor {
  constructor(queueName) {
    super();
    this.queueName = queueName;
  }

  [yieldableSymbol](taskInstance, resumeIndex) {
    schedule(this.queueName, () => {
      taskInstance.proceed(resumeIndex, YIELDABLE_CONTINUE, null);
    });
  }
}

class WaitForEventYieldable extends WaitFor {
  constructor(object, eventName) {
    super();
    this.object = object;
    this.eventName = eventName;
  }

  [yieldableSymbol](taskInstance, resumeIndex) {
    let unbind = () => {};
    let fn = (event) => {
      unbind();
      taskInstance.proceed(resumeIndex, YIELDABLE_CONTINUE, event);
    };

    if (typeof this.object.addEventListener === 'function') {
      // assume that we're dealing with a DOM `EventTarget`.
      this.object.addEventListener(this.eventName, fn);

      // unfortunately this is required, because IE 11 does not support the
      // `once` option: https://caniuse.com/#feat=once-event-listener
      unbind = () => {
        this.object.removeEventListener(this.eventName, fn);
      };

      return unbind;
    } else {
      // assume that we're dealing with either `Ember.Evented` or a compatible
      // interface, like jQuery.
      this.object.one(this.eventName, fn);

      return () => {
        this.object.off(this.eventName, fn);
      };
    }
  }
}

class WaitForPropertyYieldable extends WaitFor {
  constructor(object, key, predicateCallback = Boolean) {
    super();
    this.object = object;
    this.key = key;

    if (typeof predicateCallback === 'function') {
      this.predicateCallback = predicateCallback;
    } else {
      this.predicateCallback = (v) => v === predicateCallback;
    }
  }

  [yieldableSymbol](taskInstance, resumeIndex) {
    let observerFn = () => {
      let value = get(this.object, this.key);
      let predicateValue = this.predicateCallback(value);
      if (predicateValue) {
        taskInstance.proceed(resumeIndex, YIELDABLE_CONTINUE, value);
        return true;
      }
    };

    if (!observerFn()) {
      this.object.addObserver(this.key, null, observerFn);
      return () => {
        this.object.removeObserver(this.key, null, observerFn);
      };
    }
  }
}

export function waitForQueue(queueName) {
  return new WaitForQueueYieldable(queueName);
}

export function waitForEvent(object, eventName) {
  assert(`${object} must include Ember.Evented (or support \`.one()\` and \`.off()\`) or DOM EventTarget (or support \`addEventListener\` and  \`removeEventListener\`) to be able to use \`waitForEvent\``, isEventedObject(object));
  return new WaitForEventYieldable(object, eventName);
}

export function waitForProperty(object, key, predicateCallback) {
  return new WaitForPropertyYieldable(object, key, predicateCallback);
}
