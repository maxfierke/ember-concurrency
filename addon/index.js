import { timeout } from './utils';
import { TaskProperty } from './-task-property';
import { didCancel } from './-task-instance';
import { TaskGroupProperty } from './-task-group';
import { all, allSettled, hash, race } from './-cancelable-promise-helpers';
import { waitForQueue, waitForEvent, waitForProperty } from './-wait-for';

/**
 * A Task is a cancelable, restartable, asynchronous operation that
 * is driven by a generator function. Tasks are automatically canceled
 * when the object they live on is destroyed (e.g. a Component
 * is unrendered).
 *
 * To define a task, use the `task(...)` function, and pass in
 * a generator function, which will be invoked when the task
 * is performed. The reason generator functions are used is
 * that they (like the proposed ES7 async-await syntax) can
 * be used to elegantly express asynchronous, cancelable
 * operations.
 *
 * You can also define an
 * <a href="/docs/encapsulated-task">Encapsulated Task</a>
 * by passing in an object that defined a `perform` generator
 * function property.
 *
 * The following Component defines a task called `myTask` that,
 * when performed, prints a message to the console, sleeps for 1 second,
 * prints a final message to the console, and then completes.
 *
 * ```js
 * import { task, timeout } from 'ember-concurrency';
 * export default Component.extend({
 *   myTask: task(function * () {
 *     console.log("Pausing for a second...");
 *     yield timeout(1000);
 *     console.log("Done!");
 *   })
 * });
 * ```
 *
 * ```hbs
 * <button {{action myTask.perform}}>Perform Task</button>
 * ```
 *
 * By default, tasks have no concurrency constraints
 * (multiple instances of a task can be running at the same time)
 * but much of a power of tasks lies in proper usage of Task Modifiers
 * that you can apply to a task.
 *
 * @function task
 * @export named
 * @param {function} generatorFunction the generator function backing the task.
 * @return {TaskProperty}
 */
export function task(...args) {
  return new TaskProperty(...args);
}

/**
 * "Task Groups" provide a means for applying
 * task modifiers to groups of tasks. Once a [`Task`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-property~Task) is declared
 * as part of a group task, modifiers like `drop()` or `restartable()`
 * will no longer affect the individual `Task`. Instead those
 * modifiers can be applied to the entire group.
 *
 * ```js
 * import { task, taskGroup } from 'ember-concurrency';
 *
 * export default Controller.extend({
 *   chores: taskGroup().drop(),
 *
 *   mowLawn:       task(taskFn).group('chores'),
 *   doDishes:      task(taskFn).group('chores'),
 *   changeDiapers: task(taskFn).group('chores')
 * });
 * ```
 * @function taskGroup
 * @export named
 * @return {TaskGroup}
*/
export function taskGroup(...args) {
  return new TaskGroupProperty(...args);
}

export {
  /**
   * A cancelation-aware variant of [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).
   * The normal version of a `Promise.all` just returns a regular, uncancelable
   * Promise. The `ember-concurrency` variant of `all()` has the following
   * additional behavior:
   *
   * - if the task that `yield`ed `all()` is canceled, any of the
   *   [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s passed in to `all` will be canceled
   * - if any of the [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s (or regular promises) passed in reject (or
   *   are canceled), all of the other unfinished `TaskInstance`s will
   *   be automatically canceled.
   *
   * [Check out the "Awaiting Multiple Child Tasks example"](/docs/examples/joining-tasks)
   *
   * @function all
   * @export named
   * @return {Promise}
   */
  all,

  /**
   * A cancelation-aware variant of [RSVP.allSettled](http://emberjs.com/api/classes/RSVP.html#method_allSettled).
   * The normal version of a `RSVP.allSettled` just returns a regular, uncancelable
   * Promise. The `ember-concurrency` variant of `allSettled()` has the following
   * additional behavior:
   *
   * - if the task that `yield`ed `allSettled()` is canceled, any of the
   *   [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s passed in to `allSettled` will be canceled
   *
   * @function allSettled
   * @export named
   * @return {Promise}
   */
  allSettled,

  /**
   * Returns true if the object passed to it is a TaskCancelation error.
   * If you call `someTask.perform().catch(...)` or otherwise treat
   * a [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance) like a promise, you may need to
   * handle the cancelation of a TaskInstance differently from
   * other kinds of errors it might throw, and you can use this
   * convenience function to distinguish cancelation from errors.
   *
   * ```js
   * click() {
   *   this.get('myTask').perform().catch(e => {
   *     if (!didCancel(e)) { throw e; }
   *   });
   * }
   * ```
   *
   * @function didCancel
   * @export named
   * @param {Object} error the caught error, which might be a TaskCancelation
   * @return {Boolean}
   */
  didCancel,

  /**
   * A cancelation-aware variant of [RSVP.hash](http://emberjs.com/api/classes/RSVP.html#hash).
   * The normal version of a `RSVP.hash` just returns a regular, uncancelable
   * Promise. The `ember-concurrency` variant of `hash()` has the following
   * additional behavior:
   *
   * - if the task that `yield`ed `hash()` is canceled, any of the
   *   [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s passed in to `allSettled` will be canceled
   * - if any of the items rejects/cancels, all other cancelable items
   *   (e.g. [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s) will be canceled
   *
   * @function hash
   * @export named
   * @return {Promise}
   */
  hash,

  /**
   * A cancelation-aware variant of [Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).
   * The normal version of a `Promise.race` just returns a regular, uncancelable
   * Promise. The `ember-concurrency` variant of `race()` has the following
   * additional behavior:
   *
   * - if the task that `yield`ed `race()` is canceled, any of the
   *   [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s passed in to `race` will be canceled
   * - once any of the tasks/promises passed in complete (either success, failure,
   *   or cancelation), any of the [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s passed in will be canceled
   *
   * [Check out the "Awaiting Multiple Child Tasks example"](/docs/examples/joining-tasks)
   *
   * @function race
   * @export named
   * @return {Promise}
   */
  race,

  /**
   *
   * Yielding `timeout(ms)` will pause a task for the duration
   * of time passed in, in milliseconds.
   *
   * The task below, when performed, will print a message to the
   * console every second.
   *
   * ```js
   * export default Component.extend({
   *   myTask: task(function * () {
   *     while (true) {
   *       console.log("Hello!");
   *       yield timeout(1000);
   *     }
   *   })
   * });
   * ```
   * @function timeout
   * @export named
   * @param {number} ms - the amount of time to sleep before resuming
   *   the task, in milliseconds
   * @return {Promise}
   */
  timeout,

  /**
   * Use `waitForQueue` to pause the task until a certain run loop queue is reached.
   *
   * ```js
   * import { task, waitForQueue } from 'ember-concurrency';
   * export default Component.extend({
   *   myTask: task(function * () {
   *     yield waitForQueue('afterRender');
   *     console.log("now we're in the afterRender queue");
   *   })
   * });
   * ```
   * @function waitForQueue
   * @export named
   * @param {string} queueName the name of the Ember run loop queue
   * @return {WaitForQueueYieldable}
   */
  waitForQueue,

  /**
 * Use `waitForEvent` to pause the task until an event is fired. The event
 * can either be a jQuery event or an Ember.Evented event (or any event system
 * where the object supports `.on()` `.one()` and `.off()`).
 *
 * ```js
 * import { task, waitForEvent } from 'ember-concurrency';
 * export default Component.extend({
 *   myTask: task(function * () {
 *     console.log("Please click anywhere..");
 *     let clickEvent = yield waitForEvent($('body'), 'click');
 *     console.log("Got event", clickEvent);
 *
 *     let emberEvent = yield waitForEvent(this, 'foo');
 *     console.log("Got foo event", emberEvent);
 *
 *     // somewhere else: component.trigger('foo', { value: 123 });
 *   })
 * });
 * ```
 *
 * @function waitForEvent
 * @export named
 * @param {object} object the Ember Object or jQuery selector (with ,on(), .one(), and .off())
 *                 that the event fires from
 * @param {function} eventName the name of the event to wait for
 * @return {WaitForEventYieldable}
 */
  waitForEvent,

  /**
 * Use `waitForProperty` to pause the task until a property on an object
 * changes to some expected value. This can be used for a variety of use
 * cases, including synchronizing with another task by waiting for it
 * to become idle, or change state in some other way. If you omit the
 * callback, `waitForProperty` will resume execution when the observed
 * property becomes truthy. If you provide a callback, it'll be called
 * immediately with the observed property's current value, and multiple
 * times thereafter whenever the property changes, until you return
 * a truthy value from the callback, or the current task is canceled.
 * You can also pass in a non-Function value in place of the callback,
 * in which case the task will continue executing when the property's
 * value becomes the value that you passed in.
 *
 * ```js
 * import { task, waitForProperty } from 'ember-concurrency';
 * export default Component.extend({
 *   foo: 0,
 *
 *   myTask: task(function * () {
 *     console.log("Waiting for `foo` to become 5");
 *
 *     yield waitForProperty(this, 'foo', v => v === 5);
 *     // alternatively: yield waitForProperty(this, 'foo', 5);
 *
 *     // somewhere else: this.set('foo', 5)
 *
 *     console.log("`foo` is 5!");
 *
 *     // wait for another task to be idle before running:
 *     yield waitForProperty(this, 'otherTask.isIdle');
 *     console.log("otherTask is idle!");
 *   })
 * });
 * ```
 * @function waitForProperty
 * @export named
 * @param {object} object an object (most likely an Ember Object)
 * @param {string} key the property name that is observed for changes
 * @param {function} callbackOrValue a Function that should return a truthy value
 *                                   when the task should continue executing, or
 *                                   a non-Function value that the watched property
 *                                   needs to equal before the task will continue running
 * @return {WaitForPropertyYieldable}
 */
  waitForProperty
};
