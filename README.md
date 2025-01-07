# wordcounter

A Google Docs Add-On to calculate the word and character count of all quizbowl questions in a Google Doc.

### To use:
1. Open the relevant Google Doc
2. Go to Extensions -> Apps Script
3. Copy wordcounter.gs and sidebar.html into the Apps Script workspace and save
4. Rename the Apps Script project to "Wordcounter"
5. Under Project Settings (the Gear icon on the left), uncheck "Enable Chrome V8 runtime"
6. Refresh the doc, there should be an additional option under Extensions that says "Wordcounter". Click this
7. Allow all the permissions
8. Click the "Wordcounter" script under Extensions again, you should get a sidebar that pops out
9. Click "Update" whenever you want a word/character count.

### Wordcounter in action (on WORKSHOP 2022 leftover science questions):
<img width="1280" alt="wordcounter_updated_better" src="https://user-images.githubusercontent.com/8041675/184692218-8e0c208a-124c-4fe0-957c-c58d26950c2b.png">


### Features:
Automatically excludes:
- description acceptable/note to player or moderator prompts at the beginning of questions/bonus parts.
- pronunciation guides
- answerlines within bonuses
- \[10\] or \[10e/m/h\] at beginning of bonus parts
- weird formatting (e.g. double spaces after sentences).

#### Additional features:
- highlights in red things that are above a modifiable word/character count limit.
- if the doc contains subcategories formatted with Heading text, the outputted question list will reflect this; furthermore, you can expand/contract subcategories by clicking on anything in the subcategory.
- toggle viewing only questions that are too long or all questions.
- counts are displayed in a nice table (thanks to Eleanor Settle for the suggestion)

feel free to discord/message/github (?) me with feature requests!

