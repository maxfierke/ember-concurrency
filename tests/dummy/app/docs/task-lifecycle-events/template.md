<h2>Task lifecycle events</h2>

<p>
  ember-concurrency implements a number of lifecycle events that allow
  for a host object to react to various changes in task instance lifecycle.
  Using lifecycle hooks allows for adding things like instrumentation to tasks
  or for separating and reusing error handling code across different tasks.
  Using the <code>.evented()</code> modifier will enable tasks to fire lifecycle
  events on their host objects.
</p>

<p>
  In the below example, we refactor the
  {{link-to 'AJAX throttling example' 'docs.examples.ajax-throttling'}} to use
  task events for logging of the <code>ajaxTask</code>'s state changes, instead
  of doing it manually in the looping task itself.
</p>

<h2>Live Example</h2>

{{task-lifecycle-events-example}}

{{docs-snippet name="task-lifecycle-events.js"}}

