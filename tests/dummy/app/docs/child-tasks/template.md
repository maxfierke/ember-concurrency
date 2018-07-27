<h3>Child Tasks</h3>

<p>
  Tasks can call other tasks by <code>yield</code>ing the
  result of <code>anotherTask.perform()</code>. When this happens,
  the Parent task will wait for the Child task to complete before
  proceeding. If the Parent task is canceled, the Child task will
  automatically be canceled as well.
</p>

<h4>Example</h4>

{{! BEGIN-SNIPPET child-tasks-template }}
<h5>{{status}}</h5>

<ul>
  <li>Parent Task:     {{parentTask.state}}</li>
  <li>Child Task:      {{childTask.state}}</li>
  <li>Grandchild Task: {{grandchildTask.state}}</li>
</ul>

<button class="button" onclick={{perform parentTask}}>
  {{#if parentTask.isRunning}}
    Restart Parent Task
  {{else}}
    Perform Parent Task
  {{/if}}
</button>
{{! END-SNIPPET }}

{{code-snippet name="child-tasks.js"}}
{{code-snippet name="child-tasks-template.hbs"}}

