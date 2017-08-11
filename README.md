Userland algebraic effects in JS
================================

This repository is highly experimental and is absolutely not production ready.

It is a tentative implementation of the concepts behind algebraic effects in JS.

### The Problem and how Algebraic Effects can help

The JS computation model basically works the following way:
- JS has a task queue, and runs tasks to completion.
- Tasks can be scheduled either directly by the host environment (browser, node) in reaction to native events: `postmessage`, `fs.readFile` returning, etc, or indirectly when JS calls scheduling functions such as `setTimeout` or `new Promise`. [1]

At any point in time, JS is either idle, or running a synchronous task. JS itself isn't capable of doing asynchronous work - it merely delegates asynchronous tasks to the host environment, which itself does async work in the background, and enqueues a new task to handle the results (usually using callbacks).

The problem is that




[1] Scheduling is actually more complex since there are actually multiple tasks queues and a priority system, depending on the host environment, but for all intents and purposes here, the task queue is opaque.
