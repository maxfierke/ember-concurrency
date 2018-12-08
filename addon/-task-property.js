import { scheduleOnce } from '@ember/runloop';
import { addObserver } from '@ember/object/observers';
import { addListener } from '@ember/object/events';
import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';
import Ember from 'ember';
import {
  default as TaskInstance,
  getRunningInstance
} from './-task-instance';
import {
  PERFORM_TYPE_DEFAULT,
  PERFORM_TYPE_UNLINKED,
  PERFORM_TYPE_LINKED
} from './-task-instance';
import TaskStateMixin from './-task-state-mixin';
import { TaskGroup } from './-task-group';
import {
  propertyModifiers,
  resolveScheduler
} from './-property-modifiers-mixin';
import {
  objectAssign,
  INVOKE,
  _cleanupOnDestroy,
  _ComputedProperty
} from './utils';
import EncapsulatedTask from './-encapsulated-task';

const PerformProxy = EmberObject.extend({
  _task: null,
  _performType: null,
  _linkedObject: null,

  perform(...args) {
    return this._task._performShared(args, this._performType, this._linkedObject);
  },
});

/**
 * The `Task` object lives on a host Ember object (e.g.
 * a Component, Route, or Controller). You call the
 * {@linkcode Task#perform .perform()} method on this object
 * to create run individual [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s,
 * and at any point, you can call the {@linkcode Task#cancelAll .cancelAll()}
 * method on this object to cancel all running or enqueued
 * [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance)s.
 *
 * A Task is returned when accessing a task property on an object and should not
 * be created manually or imported directly.
 *
 * @class Task
 * @constructor
 * @export named
 */
export const Task = EmberObject.extend(TaskStateMixin, {
  /**
   * `true` if any current task instances are running.
   *
   * @property isRunning
   * @type {boolean}
   * @readOnly
   */

  /**
   * `true` if any future task instances are queued.
   *
   * @property isQueued
   * @type {boolean}
   * @readOnly
   */

  /**
   * `true` if the task is not in the running or queued state.
   *
   * @property isIdle
   * @type {boolean}
   * @readOnly
   */

  /**
   * The current state of the task: `"running"`, `"queued"` or `"idle"`.
   *
   * @property state
   * @type {string}
   * @readOnly
   */

  /**
   * The most recently started task instance.
   *
   * @property last
   * @type {TaskInstance}
   * @readOnly
   */

  /**
   * The most recent task instance that is currently running.
   *
   * @property lastRunning
   * @type {TaskInstance}
   * @readOnly
   */

  /**
   * The most recently performed task instance.
   *
   * @property lastPerformed
   * @type {TaskInstance}
   * @readOnly
   */

  /**
   * The most recent task instance that succeeded.
   *
   * @property lastSuccessful
   * @type {TaskInstance}
   * @readOnly
   */

  /**
   * The most recently completed task instance.
   *
   * @property lastComplete
   * @type {TaskInstance}
   * @readOnly
   */

  /**
   * The most recent task instance that errored.
   *
   * @property lastErrored
   * @type {TaskInstance}
   * @readOnly
   */

  /**
   * The most recently canceled task instance.
   *
   * @property lastCanceled
   * @type {TaskInstance}
   * @readOnly
   */

  /**
   * The most recent task instance that is incomplete.
   *
   * @property lastIncomplete
   * @type {TaskInstance}
   * @readOnly
   */

  /**
   * The number of times this task has been performed.
   *
   * @property performCount
   * @type {number}
   * @readOnly
   */

  fn: null,
  context: null,
  _observes: null,
  _curryArgs: null,
  _linkedObjects: null,

  init() {
    this._super(...arguments);

    if (typeof this.fn === 'object') {
      let owner = getOwner(this.context);
      let ownerInjection = owner ? owner.ownerInjection() : {};
      this._taskInstanceFactory = EncapsulatedTask.extend(ownerInjection, this.fn);
    }

    _cleanupOnDestroy(this.context, this, 'cancelAll', 'the object it lives on was destroyed or unrendered');
  },

  _curry(...args) {
    let task = this._clone();
    task._curryArgs = [...(this._curryArgs || []), ...args];
    return task;
  },

  /**
   * @method linked
   */
  linked() {
    let taskInstance = getRunningInstance();
    if (!taskInstance) {
      throw new Error(`You can only call .linked() from within a task.`);
    }

    return PerformProxy.create({
      _task: this,
      _performType: PERFORM_TYPE_LINKED,
      _linkedObject: taskInstance,
    });
  },

  /**
   * @method unlinked
   */
  unlinked() {
    return PerformProxy.create({
      _task: this,
      _performType: PERFORM_TYPE_UNLINKED,
    });
  },

  _clone() {
    return Task.create({
      fn: this.fn,
      context: this.context,
      _origin: this._origin,
      _taskGroupPath: this._taskGroupPath,
      _scheduler: this._scheduler,
      _propertyName: this._propertyName,
    });
  },

  /**
   * Cancels all running or queued `TaskInstance`s for this Task.
   * If you're trying to cancel a specific TaskInstance (rather
   * than all of the instances running under this task) call
   * `.cancel()` on the specific TaskInstance.
   *
   * @method cancelAll
   * @return {void}
   */

  toString() {
    return `<Task:${this._propertyName}>`;
  },

  _taskInstanceFactory: TaskInstance,

  /**
   * Creates a new [`TaskInstance`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-instance~TaskInstance) and attempts to run it right away.
   * If running this task instance would increase the task's concurrency
   * to a number greater than the task's maxConcurrency, this task
   * instance might be immediately canceled (dropped), or enqueued
   * to run at later time, after the currently running task(s) have finished.
   *
   * @method perform
   * @param {*} [...args] arguments to pass to the task function
   *
   * @fires TaskInstance#TASK_NAME:started
   * @fires TaskInstance#TASK_NAME:succeeded
   * @fires TaskInstance#TASK_NAME:errored
   * @fires TaskInstance#TASK_NAME:canceled
   *
   * @return {TaskInstance}
   */
  perform(...args) {
    return this._performShared(args, PERFORM_TYPE_DEFAULT, null);
  },

  _performShared(args, performType, linkedObject) {
    let fullArgs = this._curryArgs ? [...this._curryArgs, ...args] : args;
    let taskInstance = this._taskInstanceFactory.create({
      fn: this.fn,
      args: fullArgs,
      context: this.context,
      owner: this.context,
      task: this,
      _debug: this._debug,
      _hasEnabledEvents: this._hasEnabledEvents,
      _origin: this,
      _performType: performType,
    });

    if (performType === PERFORM_TYPE_LINKED) {
      linkedObject._expectsLinkedYield = true;
    }

    if (this.context.isDestroying) {
      // TODO: express this in terms of lifetimes; a task linked to
      // a dead lifetime should immediately cancel.
      taskInstance.cancel();
    }

    this._scheduler.schedule(taskInstance);
    return taskInstance;
  },

  [INVOKE](...args) {
    return this.perform(...args);
  },
});

/**
 * A [`TaskProperty`](/docs/api/modules/ember-concurrency/-task-property) is the Computed Property-like object returned
 * from the [`Task`](http://localhost:4200/docs/api/modules/ember-concurrency/-task-property~Task) function. You can call Task Modifier methods
 * on this object to configure the behavior of the {@link Task}.
 *
 * See [Managing Task Concurrency](/docs/task-concurrency) for an
 * overview of all the different task modifiers you can use and how
 * they impact automatic cancelation / enqueueing of task instances.
 *
 * A TaskProperty is returned by the `task` function and should not be created
 * manually or imported directly.
 *
 * @class TaskProperty
 * @constructor
 * @export named
*/
export function TaskProperty(taskFn) {
  let tp = this;
  _ComputedProperty.call(this, function(_propertyName) {
    taskFn.displayName = `${_propertyName} (task)`;
    return Task.create({
      fn: tp.taskFn,
      context: this,
      _origin: this,
      _taskGroupPath: tp._taskGroupPath,
      _scheduler: resolveScheduler(tp, this, TaskGroup),
      _propertyName,
      _debug: tp._debug,
      _hasEnabledEvents: tp._hasEnabledEvents
    });
  });

  this.taskFn = taskFn;
  this.eventNames = null;
  this.cancelEventNames = null;
  this._observes = null;
}

TaskProperty.prototype = Object.create(_ComputedProperty.prototype);
objectAssign(TaskProperty.prototype, propertyModifiers, {
  constructor: TaskProperty,

  setup(proto, taskName) {
    if (this._maxConcurrency !== Infinity && !this._hasSetBufferPolicy) {
      Ember.Logger.warn(`The use of maxConcurrency() without a specified task modifier is deprecated and won't be supported in future versions of ember-concurrency. Please specify a task modifier instead, e.g. \`${taskName}: task(...).enqueue().maxConcurrency(${this._maxConcurrency})\``);
    }

    registerOnPrototype(addListener, proto, this.eventNames, taskName, 'perform', false);
    registerOnPrototype(addListener, proto, this.cancelEventNames, taskName, 'cancelAll', false);
    registerOnPrototype(addObserver, proto, this._observes, taskName, 'perform', true);
  },

  /**
   * Calling `task(...).on(eventName)` configures the task to be
   * automatically performed when the specified events fire. In
   * this way, it behaves like
   * [Ember.on](http://emberjs.com/api/classes/Ember.html#method_on).
   *
   * You can use `task(...).on('init')` to perform the task
   * when the host object is initialized.
   *
   * ```js
   * export default Ember.Component.extend({
   *   pollForUpdates: task(function * () {
   *     // ... this runs when the Component is first created
   *     // because we specified .on('init')
   *   }).on('init'),
   *
   *   handleFoo: task(function * (a, b, c) {
   *     // this gets performed automatically if the 'foo'
   *     // event fires on this Component,
   *     // e.g., if someone called component.trigger('foo')
   *   }).on('foo'),
   * });
   * ```
   *
   * [See the Writing Tasks Docs for more info](/docs/writing-tasks)
   *
   * @method on
   * @param {String} ...eventNames
   * @return {TaskProperty}
   */
  on() {
    this.eventNames = this.eventNames || [];
    this.eventNames.push.apply(this.eventNames, arguments);
    return this;
  },

  /**
   * This behaves like the {@linkcode TaskProperty#on task(...).on() modifier},
   * but instead will cause the task to be canceled if any of the
   * specified events fire on the parent object.
   *
   * [See the Live Example](/docs/examples/route-tasks/1)
   *
   * @method cancelOn
   * @param {String} ...eventNames
   * @return {TaskProperty}
   */
  cancelOn() {
    this.cancelEventNames = this.cancelEventNames || [];
    this.cancelEventNames.push.apply(this.cancelEventNames, arguments);
    return this;
  },

  /**
   * Calling `task(...).observes('someProperty')` configures the task to be
   * automatically performed when any of the specified properties change.
   *
   * @method observes
   * @param {*} ...properties
   */
  observes(...properties) {
    this._observes = properties;
    return this;
  },

  /**
   * Configures the task to cancel old currently task instances
   * to make room for a new one to perform. Sets default
   * maxConcurrency to 1.
   *
   * [See the Live Example](/docs/examples/route-tasks/1)
   *
   * @method restartable
   * @return {TaskProperty}
   */

  /**
   * Configures the task to run task instances one-at-a-time in
   * the order they were `.perform()`ed. Sets default
   * maxConcurrency to 1.
   *
   * @method enqueue
   * @return {TaskProperty}
   */

  /**
   * Configures the task to immediately cancel (i.e. drop) any
   * task instances performed when the task is already running
   * at maxConcurrency. Sets default maxConcurrency to 1.
   *
   * @method drop
   * @return {TaskProperty}
   */

  /**
   * Configures the task to drop all but the most recently
   * performed {@linkcode TaskInstance }.
   *
   * @method keepLatest
   * @return {TaskProperty}
   */

  /**
   * Sets the maximum number of task instances that are allowed
   * to run at the same time. By default, with no task modifiers
   * applied, this number is Infinity (there is no limit
   * to the number of tasks that can run at the same time).
   * {@linkcode TaskProperty#restartable .restartable()},
   * {@linkcode TaskProperty#enqueue .enqueue()}, and
   * {@linkcode TaskProperty#drop .drop()} set the default
   * maxConcurrency to 1, but you can override this value
   * to set the maximum number of concurrently running tasks
   * to a number greater than 1.
   *
   * [See the AJAX Throttling example](/docs/examples/ajax-throttling)
   *
   * The example below uses a task with `maxConcurrency(3)` to limit
   * the number of concurrent AJAX requests (for anyone using this task)
   * to 3.
   *
   * ```js
   * doSomeAjax: task(function * (url) {
   *   return Ember.$.getJSON(url).promise();
   * }).maxConcurrency(3),
   *
   * elsewhere() {
   *   this.get('doSomeAjax').perform("http://www.example.com/json");
   * },
   * ```
   *
   * @method maxConcurrency
   * @param {Number} n The maximum number of concurrently running tasks
   * @return {TaskProperty}
   */

  /**
   * Adds this task to a TaskGroup so that concurrency constraints
   * can be shared between multiple tasks.
   *
   * [See the Task Group docs for more information](/docs/task-groups)
   *
   * @method group
   * @param {String} groupPath A path to the TaskGroup property
   * @return {TaskProperty}
   */

  /**
   * Activates lifecycle events, allowing Evented host objects to react to task state
   * changes.
   *
   * ```js
   *
   * export default Component.extend({
   *   uploadTask: task(function* (file) {
   *     // ... file upload stuff
   *   }).evented(),
   *
   *   uploadedStarted: on('uploadTask:started', function(taskInstance) {
   *     this.get('analytics').track("User Photo: upload started");
   *   }),
   * });
   * ```
   *
   * @method evented
   * @return {TaskProperty}
   */

  /**
   * Logs lifecycle events to aid in debugging unexpected Task behavior.
   * Presently only logs cancelation events and the reason for the cancelation,
   * e.g. "TaskInstance 'doStuff' was canceled because the object it lives on was destroyed or unrendered"
   *
   * @method debug
   * @return {TaskProperty}
   */

  perform() {
    throw new Error("It looks like you tried to perform a task via `this.nameOfTask.perform()`, which isn't supported. Use `this.get('nameOfTask').perform()` instead.");
  },
});

function registerOnPrototype(addListenerOrObserver, proto, names, taskName, taskMethod, once) {
  if (names) {
    for (let i = 0; i < names.length; ++i) {
      let name = names[i];
      addListenerOrObserver(proto, name, null, makeTaskCallback(taskName, taskMethod, once));
    }
  }
}

function makeTaskCallback(taskName, method, once) {
  return function() {
    let task = this.get(taskName);

    if (once) {
      scheduleOnce('actions', task, method, ...arguments);
    } else {
      task[method].apply(task, arguments);
    }
  };
}
