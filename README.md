# PushPop

PushPop is a small, local-first daily task list. Add a few things you want
to do today, estimate how long they might take, and check them off as you go.

Tasks stay on the device in your browser’s IndexedDB. There are no accounts,
servers, or long-term completion records.

## Features

- Create tasks with a name, optional description, and estimated time in minutes.
- Edit task details while keeping the task’s completion status.
- Mark tasks complete and keep them visible in the list.
- Permanently remove tasks.
- Reset all tasks to uncompleted for a fresh day.
- Store tasks locally in IndexedDB.
- Responsive layout with keyboard-friendly controls and accessible labels.

## Run locally

PushPop has no build step or package dependencies. Serve the project directory
with any static file server, then open the address it provides in a modern
browser.

For example, if you have Python installed:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

Opening `index.html` directly may work in some browsers, but a local web server
provides the most reliable browser storage behavior.

## Data and privacy

Tasks are saved in the browser’s IndexedDB under the `pushpop-daily` database.
They are not sent to a server. Clearing site data or using another browser or
device will remove or hide the saved list. PushPop does not keep completion
history; reset only changes the current tasks back to uncompleted.

## Project files

- `index.html` — page structure and task form
- `styles.css` — responsive visual styles
- `app.js` — task interactions and IndexedDB persistence

## Browser support

PushPop requires a modern browser with JavaScript, IndexedDB, and support for
HTML dialog elements.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
