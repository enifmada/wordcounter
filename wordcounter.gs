/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('Word/Char counter');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Gets the text the user has selected. If there is no selection,
 * this function displays an error message.
 *
 * @return {Array.<string>} The selected text.
 */
function processPars(){
  var MAX_WORDS_TU = 135;
  var MAX_WORDS_BO = 150;
  var MAX_CHARS_TU = 1500;
  var MAX_CHARS_BO = 1500;

  var h1 = DocumentApp.ParagraphHeading.HEADING1;
  var h2 = DocumentApp.ParagraphHeading.HEADING2;

  var all_qs = [];
  var cat = null;
  var answers = [];
  var wordlengths = [];
  var charlengths = [];
  var valid = [];
  var context = "tossups";
  var bonuscounter = 0;
  var bonuswordlength = 0;
  var bonuscharlength = 0;
  var bonusanswers = "";

  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  
  var searchType = DocumentApp.ElementType.PARAGRAPH;
  var searchResult = null;

  while (searchResult = body.findElement(searchType, searchResult)) {
    var par = searchResult.getElement().asParagraph();
    var parhead = par.getHeading();
    var partext = par.getText();
  
    if (partext.length < 2){
      continue;
    }
    if (parhead == h1){
        all_qs.push({cat: cat, answers: answers, wordlengths: wordlengths, charlengths: charlengths, valid: valid});
        cat = partext;
        answers = [];
        wordlengths = [];
        charlengths = [];
        valid = [];
    }
    else if (parhead == h2){
      context = partext.toLowerCase();
    }
    else{
      if (partext.substr(0, 1) == "<"){
        continue;
      }
      if (context == "tossups"){
        if (partext.substr(0, 7) == "ANSWER:"){
          answers.push(extractPrimaryAnswer(partext.substr(8)));

        }
        else{
          sanitized_text = removeInstructions(partext, par.editAsText().isItalic(0));
          charlengths.push(sanitized_text.length);
          wordlengths.push(sanitized_text.split(" ").length);
          var validpush = "good";
          if (sanitized_text.length > MAX_CHARS_TU || sanitized_text.split(" ").length > MAX_WORDS_TU){
            validpush = "bad";
          }
          valid.push(validpush);
        }
      }
      else{
        if (partext.substr(0,1) == "[")
        {
          endbracket = partext.indexOf("]");
          sanitized_text = removeInstructions(partext.substr(endbracket+2), par.editAsText().isItalic(endbracket+2))
          bonuscharlength += sanitized_text.length;
          bonuswordlength += sanitized_text.split(" ").length;
        }
        else{
          if(partext.substr(0,7) == "ANSWER:"){
            bonuscounter += 1;
            bonusanswers += "/"+extractPrimaryAnswer(partext.substr(8));
            if (bonuscounter >= 3){
              wordlengths.push(bonuswordlength);
              charlengths.push(bonuscharlength);
              answers.push(bonusanswers.substr(1));
              var validpush = "good";
              if (bonuscharlength > MAX_CHARS_BO || bonuswordlength > MAX_WORDS_BO){
                validpush = "bad";
              }
              valid.push(validpush);
              bonuscounter = 0;
              bonuswordlength = 0;
              bonuscharlength = 0;
              bonusanswers = "";
            }
          }
          else{
            sanitized_text = removeInstructions(partext, par.editAsText().isItalic(0))
            bonuscharlength += sanitized_text.length;
            bonuswordlength += sanitized_text.split(" ").length;
          }
        }

        continue;
      }
    }
  }
  all_qs.push({cat: cat, answers: answers, wordlengths: wordlengths, charlengths: charlengths, valid: valid});
  return all_qs.slice(1);
}


function removeInstructions(text, startitalic){
  while (text.indexOf('("') >= 0)
  {
    text = text.substr(0, text.indexOf('("')) + text.substr(text.indexOf('")')+3);
  }
  powermarkloc = text.indexOf("(*)");
  if (powermarkloc >= 0){
    text = text.substr(0, powermarkloc) + text.substr(powermarkloc+4)
  }
  if (startitalic){
    if (text.indexOf('Note to') == 0 || text.indexOf('Description acceptable') == 0){
      text = text.substr(text.indexOf(".")+2);
    }
  }
  return text.trim().replace(/\s{2,}/g, ' ');
}

function extractPrimaryAnswer(answertext){
  bracket_start = answertext.indexOf("[");
  paren_start = answertext.indexOf("(");
  if (paren_start == 0 ){
    answertext = answertext.substr(answertext.indexOf(")")+1);
    paren_start = answertext.indexOf("(");
    bracket_start = answertext.indexOf("[");
  }
  if (bracket_start > -1 && paren_start > -1){
    answertext = answertext.substr(0, Math.min(bracket_start, paren_start)-1);
  }
  else if (bracket_start > -1){
    answertext = answertext.substr(0, bracket_start-1);
  }
  else if (paren_start > -1){
    answertext = answertext.substr(0, paren_start-1);
  }
  return answertext.trim().replace(/\s{2,}/g, ' ');
}

function getAllCounts() {
  var processed_pars = processPars();
  return processed_pars;
}
