<h2>Cancelation</h2>

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

<h3>Explicit Cancelation</h3>

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

<h3>Example</h3>

{{#docs-demo as |demo|}}
  {{#demo.example name='cancelation-template.hbs'}}
    <h4>Running tasks: {{count}}</h4>

    <button class="button" {{action 'performTask'}}>Perform Task</button>
    {{#if count}}
      <button class="button" {{action 'cancelAll'}}>Cancel All</button>
    {{/if}}
    {{#if mostRecent.isRunning}}
      <button class="button" {{action 'cancelMostRecent'}}>Cancel Most Recent</button>
    {{/if}}
  {{/demo.example}}

  {{demo.snippet "cancelation-template.hbs"}}
  {{demo.snippet "cancelation.js"}}
{{/docs-demo}}

<p>
  <em>
    Tip: You can also use the <code>.concurrency</code> property to get
    the current number of running task instances for a given task,
    e.g. <code>\\{{myTask.concurrency}}</code>: {{myTask.concurrency}}
  </em>
</p>
