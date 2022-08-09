# wordcounter

A Google Docs Add-On to calculate the word and character count of all quizbowl questions in a Google Doc. Primarily intended for subject docs rather than final packets.

The script currently only works if the doc is formatted with subcategories as Header 1, with "Tossups" and "Bonuses" as Header 2 within each subcategory, e.g.:

\<Header 1\>Biology\</Header 1\>

\<Header 2\>Tossups\</Header 2\>

bio tossup 1

bio tossup 2

\<Header 2\>Bonuses\</Header 2\>

bio bonus 1

bio bonus 2

\<Header 1\>Chemistry\</Header 1\>
etc.

To use:
1. Open the relevant Google Doc
2. Go to Extensions -> Apps Script
3. Copy wordcounter.gs and sidebar.html into the Apps Script workspace and save
4. Rename the Apps Script project to "Wordcounter"
5. Under Project Settings (the Gear icon on the left), uncheck "Enable Chrome V8 runtime"
6. Refresh the doc, there should be an additional option under Extensions that says "Wordcounter". Click this
7. Allow all the permissions
8. Click the "Wordcounter" script under Extensions again, you should get a sidebar that pops out
9. Click "Update" whenever you want a word/character count.


Features:

Automatically excludes:

-description acceptable/note to player or moderator prompts at the beginning of questions/bonus parts.

-pronunciation guides

-answerlines within bonuses

-[10] or [10e/m/h] at beginning of bonus parts

-weird formatting (e.g. double spaces after sentences).

Additional features:

-highlights in red things that are above a modifiable word/character count limit.

-expand/contract subcategories by clicking on anything in the subcategory.

-toggle viewing only questions that are too long or all questions.



feel free to discord me/message me/github (?) me with feature requests.

