<h3>Cancelation</h3>

<p>
  <strong>ember-concurrency</strong> tasks can be canceled either
  <em>explicitly</em> (by calling one of the cancel methods
  on a task or task instance) or <em>implicitly</em> (based on
  how the task is configured, or because the task's host object
  was destroyed).
</p>

<p>
  Generally speaking, it is <em>much</em> better to configure your tasks properly
  (via {{link-to 'Task Modifiers' 'docs.task-concurrency'}})
  such that they'll be implicitly/automatically canceled at
  the right time, but there are still some cases where
  explicit cancelation is the only option.
</p>

<h4>Explicit Cancelation</h4>

<p>
  There are two ways to explicitly cancel a task:
</p>

<ol>
  <li>Call <code>task.cancelAll()</code> on the Task object &mdash;
    this will cancel all running or enqueued Task Instances for that
    task.
  </li>
  <li>Call <code>taskInstance.cancel()</code> on a Task Instance
    (the object returned from a prior call to <code>task.perform()</code>)
  </li>
</ol>

<h4>Example</h4>

{{! BEGIN-SNIPPET cancelation-template.hbs }}
<h5>Running tasks: {{count}}</h5>

<button class="button" {{action 'performTask'}}>Perform Task</button>
{{#if count}}
  <button class="button" {{action 'cancelAll'}}>Cancel All</button>
{{/if}}
{{#if mostRecent.isRunning}}
  <button class="button" {{action 'cancelMostRecent'}}>Cancel Most Recent</button>
{{/if}}
{{! END-SNIPPET }}

<p>
  <em>
    Tip: You can also use the <code>.concurrency</code> property to get
    the current number of running task instances for a given task,
    e.g. <code>\{{myTask.concurrency}}</code>: {{myTask.concurrency}}
  </em>
</p>

{{docs-snippet name="cancelation-template.hbs"}}
{{docs-snippet name="cancelation.js"}}

