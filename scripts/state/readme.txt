Want an interface to load and save application state. I want to be able to switch between states quickly. So action in parallel would be great. Redis is probably the bottleneck.

TMP directory, Static directory, blogs directory, data directory etc...

node scripts/state
- will list all available states, sorted by date created

node scripts/state debug
- will load state with label debug

node scripts/state/save
- will prompt to save new state with timestamp as label

node scripts/state/save <label>

Removing a state will be as simple as rm -rf a dir <label> inside data/
