# fix
- strange card background behind drums
- space bar is not working well and there is a lot "selecting text" when playing with the platform

# features
- option to make room 32 steps or 16

# code
- do a simple code review you'll find enough stuff like ...

1. extract initializeFromSync from @webapp/src/sequencer.ts to it's own utility file in charge of sequencer-sync 

2. Extract the last methods in @webapp/src/ui/UI.ts that are instrument-specific, to their own instrument components 

split style.css for god's sake
style beat classes should be dynamic not like jesus christ with numbers
