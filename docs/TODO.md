# fix
- strange card background behind drums
- kit and synth are not persisted / loaded on load
- when you click for the first time on the lead you scroll back to the drums (really annoying)
- I don't like the volume icon at least it should be darker.
- cloudflare pages deployment should work at https://the-synth-room.avnersorek.partykit.dev

# features
- bass instrument
- second synth
- synth instruments need to have length
- more controls on sync
- convert drums to free samples of electro drums
- loading without room id should show the available rooms, also open that dialog from the main thing.
- user names ? chat ?

# code
- move static assets into one folder for the copy plugin
- unite KitSyncManager with DrumInstrument and the like, Grid stuff should be together. 
- remove unused code
- do a simple code review you'll find enough stuff like updateKitSelector in UI.ts :) 
