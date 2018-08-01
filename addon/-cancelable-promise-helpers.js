import RSVP, { Promise } from 'rsvp';
import TaskInstance from './-task-instance';
import { yieldableSymbol } from './utils';

const asyncAll = taskAwareVariantOf(Promise, 'all', identity);

function * resolver(value) {
  return value;
}

export const all = (things) => {
  if (things.length === 0) {
    return things;
  }

  for (let i = 0; i < things.length; ++i) {
    let t = things[i];
    if(!(t && t[yieldableSymbol])) {
      return asyncAll(things);
    }
  }

  let isAsync = false;
  let taskInstances = things.map(thing => {
    let ti = TaskInstance.create({
      // TODO: consider simpler iterator than full on generator fn?
      fn: resolver,
      args: [thing],
    })._start();

    if (ti._completionState !== 1) {
      isAsync = true;
    }
    return ti;
  });

  if (isAsync) {
    return asyncAll(taskInstances);
  } else {
    return taskInstances.map(ti => ti.value);
  }
};

export const allSettled = taskAwareVariantOf(RSVP, 'allSettled', identity);
export const race = taskAwareVariantOf(Promise, 'race', identity);
export const hash = taskAwareVariantOf(RSVP, 'hash', getValues);

function identity(obj) {
  return obj;
}

function getValues(obj) {
  return Object.keys(obj).map(k => obj[k]);
}

function taskAwareVariantOf(obj, method, getItems) {
  return function(thing) {
    let items = getItems(thing);
    let defer = RSVP.defer();

    obj[method](thing).then(defer.resolve, defer.reject);

    let hasCancelled = false;
    let cancelAll = () => {
      if (hasCancelled) { return; }
      hasCancelled = true;
      items.forEach(it => {
        if (it) {
          if (it instanceof TaskInstance) {
            it.cancel();
          } else if (typeof it.__ec_cancel__ === 'function') {
            it.__ec_cancel__();
          }
        }
      });
    };

    let promise = defer.promise.finally(cancelAll);
    promise.__ec_cancel__ = cancelAll;
    return promise;
  };
}
