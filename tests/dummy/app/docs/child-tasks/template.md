<h2>Child Tasks</h2>

<p>
  Tasks can call other tasks by <code>yield</code>ing the
  result of <code>anotherTask.perform()</code>. When this happens,
  the Parent task will wait for the Child task to complete before
  proceeding. If the Parent task is canceled, the Child task will
  automatically be canceled as well.
</p>

<h3>Example</h3>

{{#docs-demo as |demo|}}
  {{#demo.example name='child-tasks-template.hbs'}}
    <h4>{{status}}</h4>

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
  {{/demo.example}}

  {{demo.snippet "child-tasks.js"}}
  {{demo.snippet "child-tasks-template.hbs"}}
{{/docs-demo}}
