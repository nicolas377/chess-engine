# Workers

On engine startup, we create a thread that is for the actual calculating.

The main thread and calculating thread communicate via object messages with a type and information.

In the calculating thread, debug logs are redirected to the main thread, and option sets are copied from/to the main thread.
