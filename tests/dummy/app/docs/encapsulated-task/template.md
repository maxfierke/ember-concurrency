<h2>Encapsulated Tasks</h2>

<p>
  Normally, you define tasks by passing a generator function to <code>task(...)</code>.
  Often though, you want to be able to expose additional state of the task,
  e.g. you might want to show the percentage progress of an <code>uploadFile</code> task,
  but unless you're using the techniques described below there's no good
  place to expose that data to the template other than to set some properties
  on the host object, but then you lose a lot of the benefits of encapsulation
  in the process.
</p>

<p>
  In cases like these, you can use Encapsulated Tasks, which behave just
  like regular tasks, but with one crucial difference: the value
  of <code>this</code> within the task function points to the currently
  running TaskInstance, rather than the host object that the task lives on
  (e.g. a Component, Controller, etc). This allows for some nice patterns
  where all of the state produced/mutated by a task can be contained (encapsulated)
  <em>within</em> the Task itself, rather than having to live on the host
  object.
</p>

<p>
  To create an encapsulated task, pass an object (instead of a generator function)
  to the <code>task()</code>
  constructor that defines a <code>perform</code> generator function. The
  object can also contain initial values for task state, as well as computed
  properties and anything else supported by classic Ember objects.
</p>

{{docs-snippet name="encapsulated-task.js"}}

<h2>Live Example</h2>

<p>
  This example demonstrates how to use encapsulated tasks to
  model file uploads. It keeps all of the upload state <em>within</em>
  each TaskInstance, and uses {{link-to 'Derived State' 'docs.derived-state'}}
  to expose the values set within the encapsulated tasks.
</p>

{{! BEGIN-SNIPPET encapsulated-task-template.hbs }}
<p>
  <button class="button" onclick={{perform uploadFile makeRandomUrl}}>
    Start Upload
  </button>
</p>

<h4>Queued Uploads: {{uploadFile.numQueued}}</h4>

{{#with uploadFile.last as |encapsTask|}}
  <h4>
    Uploading to {{encapsTask.url}} ({{encapsTask.stateText}}):
    {{encapsTask.progress}}%
  </h4>
{{/with}}

{{#if uploadFile.lastSuccessful}}
  <h4 style="color: green;">
    <strong>
    Upload to {{uploadFile.lastSuccessful.url}}:
    {{uploadFile.lastSuccessful.value}}
    </strong>
  </h4>
{{/if}}

{{! END-SNIPPET }}

{{docs-snippet name="encapsulated-task-controller.js"}}
{{docs-snippet name="encapsulated-task-template.hbs"}}
