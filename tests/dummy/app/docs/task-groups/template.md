<h3>Task Groups</h3>

<p>
  While {{link-to 'Task Modifiers' 'docs.task-concurrency'}}
  prevent a single task from running concurrently, <strong>Task Groups</strong>
  make it possible to prevent <em>multiple tasks</em> from running at the same time.
  Using Task Groups is a two-step process:
</p>

<ol>
  <li>Define the task group property, e.g. <code>nameOfGroup: taskGroup()</code></li>
  <li>For each task in the group, use <code>.group()</code> to associate
      the task with the group, e.g. <code>myTask: task(...).group('nameOfGroup')</code></li>
</ol>

<p>
  Once you define a task as part of a task group, you can no longer use
  other task modifiers like <code>drop()</code> or <code>restartable()</code>
  on that task; instead, just apply those task modifiers to the task group property instead,
  as demonstrated in the example below.
</p>

<h4>Example</h4>

<p>
  In this example, we group related "chores" tasks and by using the <code>.drop()</code>
  modifier on the <code>taskGroup</code> property we ensure that only one
  chore task runs at a time. In addition to preventing concurrency between multiple
  tasks, this example also demonstrates how having access to both the
  state of the task group, as well as its individual members,
  makes it very easy to build out common UI patterns, such as active/idle states
  of related buttons in a button bar.
</p>

{{! BEGIN-SNIPPET task-groups-template.hbs }}
{{#each tasks as |task|}}
  <button class="button {{if task.isIdle 'clickable'}}"
          onclick={{perform task}}>{{task.name}}</button>
{{/each}}

<h5>Chores group state: {{chores.state}}</h5>

<h5>
  Most Recent Chore:
  {{#with chores.last as |taskInstance|}}
    {{taskInstance.task.name}} ({{taskInstance.state}})
  {{/with}}
</h5>
{{! END-SNIPPET }}

{{docs-snippet name="task-groups.js"}}
{{docs-snippet name="task-groups-template.hbs"}}

