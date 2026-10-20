# Agentation → Codex (local development)

From the main checkout, with the normal `npm start` stack running:

```sh
bash scripts/agentation/run.sh up
codex mcp add agentation -- bash "$(pwd)/scripts/agentation/run.sh" mcp
```

Register MCP once per machine; run `up` each time you enable Agentation.
Requires Docker Compose v2 and Node 22+. If your stack uses a custom `BLOT_HOST`,
set it on `up` too. `AGENTATION_PORT` optionally changes the loopback port (8477).

**Restart Codex** after registration. No additional Codex skills or API keys are
required. In the browser, expand the toolbar, select an element and save a note.
Ask Codex to call `agentation_get_all_pending`; confirm your note and page URL.
For ongoing feedback, ask Codex to use `agentation_watch_annotations`.
Annotations travel through MCP; no prompt copying is needed.

To disable the overlay and restore the normal proxy:

```sh
bash scripts/agentation/run.sh down
```

Reload browser pages after enabling/disabling. Annotations persist locally.
[Implementation details and checks](REFERENCE.md).
