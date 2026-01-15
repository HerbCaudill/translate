### To do

- [ ] make the input text smaller
- [ ] show the icon in the header
- [ ] get rid of the focus ring on the input
- [ ] add a refresh button for results
- [ ] use mono for the input and for the translation in the results

### Done

- [x] make the tab buttons smaller and left-align them
- [x] Give the header, including input a solid blue background - same color as the icon. Make that the app color in the manifest

- [x] get rid of the gray backdrop on the tabs
- [x] remember the last selected tab (already implemented)
- [x] Show languages in the order defined in settings, not in the order they come in

- [x] Add logging for API requests, responses, and retries
- [x] Show the results in tabs. Remember the last tab the user selected. Hide the tab for the source language
- [x] get rid of the loading cards - just show a spinner while it's working, and show results as they come in
- [x] use Plex Serif for the translations
- [x] add a bit more spacing between language cards in results
- [x] English should be one of the default languages and if what I type isn't in English then it should translate it to Engish and not into the language it's already in. so there needs to be a separate step of identifying the language
- [x] trigger "save api key" on paste if the text is valid
- [x] Remove redundant "API key" label and add padding around "Get your api key..." text
- [x] don't treat the api key as a password - it's ok to show it on screen
- [x] The results display and the skeleton view should use the same component for the language cards (currently the language names are displayed differently)
- [x] Let me drag and drop languages to reorder
- [x] In the results, put the language name in a little badge on the border
- [x] Change the language interface to autocomplete. I shouldn't have to know the two-letter code for a language.
- [x] Make the results more compact: less padding, smaller text
- [x] Make the default languages Catalan, Spanish, French, and Portuguese
- [x] Make the submit button blue
