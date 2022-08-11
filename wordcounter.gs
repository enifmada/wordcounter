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
function processPars(tu_words, tu_chars, bo_words, bo_chars){

  var h1 = DocumentApp.ParagraphHeading.HEADING1;
  var h2 = DocumentApp.ParagraphHeading.HEADING2;
  var norm = DocumentApp.ParagraphHeading.NORMAL;

  var all_qs = [];
  var cat = "start";
  var answers = [];
  var wordlengths = [];
  var charlengths = [];
  var valid = [];
  var temp_cl = 0;
  var temp_wl = 0;
  var temp_answers = "";
  var question_array = [];
  var answer_array = [];
  const bonus_question_locs = [0,1,3,5];
  const bonus_answer_locs = [2,4,6];

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
    if (par.editAsText().isItalic()){
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
    else if (parhead != norm || partext.slice(0, 1) == "<"){
      continue;
    }
    else{
      q_label = partext.indexOf(". ");
      if(q_label == 1 || q_label == 2)
      {
        partext=partext.slice(q_label+2);
      }
      partext_array = splitComponent(partext);
      for(var i=0;i<partext_array.length;i++)
      {
        if (partext_array[i].slice(0,7) != "ANSWER:")
        {
          question_array.push(removeInstructions(partext_array[i]));
          answer_array.push(false);
        }
        else{
          question_array.push(extractPrimaryAnswer(partext_array[i].slice(8)));
          answer_array.push(true);
        }
        if (question_array.length == 2 && answer_array[1] == true)
        {
          answers.push(question_array[1]);
          charlengths.push(question_array[0].length);
          wordlengths.push(question_array[0].split(" ").length);
          if (question_array[0].length > tu_chars || question_array[0].split(" ").length > tu_words){valid.push("bad");}
          else{valid.push("good");}
          question_array = [];
          answer_array = [];
        }
        else if (question_array.length == 7 && answer_array[6] == true)
        {
          temp_answers = "";
          temp_cl = 0;
          temp_wl = 0;
          for (var bl = 0; bl<bonus_question_locs.length;bl++)
          {
            temp_cl += question_array[bonus_question_locs[bl]].length;
            temp_wl += question_array[bonus_question_locs[bl]].split(" ").length;
          }
          for (var al = 0; al<bonus_answer_locs.length;al++)
          {
            temp_answers += "/"+question_array[bonus_answer_locs[al]];
          }
          answers.push(temp_answers.slice(1));
          charlengths.push(temp_cl);
          wordlengths.push(temp_wl);
          if (temp_cl > bo_chars || temp_wl > bo_words){valid.push("bad");}
          else{valid.push("good");}
          question_array = [];
          answer_array = [];
        }
      }
    }
  }
  all_qs.push({cat: cat, answers: answers, wordlengths: wordlengths, charlengths: charlengths, valid: valid});
  for(i=all_qs.length-1;i>-1;i--){
    if (all_qs[i].answers.length < 1)
    {
      all_qs.splice(i, 1);
    }
  }
  return all_qs;
}


function removeInstructions(text){
  while (text.indexOf('("') >= 0)
  {
    text = text.slice(0, text.indexOf('("')) + text.slice(text.indexOf('")')+3);
  }
  powermarkloc = text.indexOf("(*)");
  if (powermarkloc >= 0){
    text = text.slice(0, powermarkloc) + text.slice(powermarkloc+4)
  }
  if (text.indexOf('Note to') == 0 || text.indexOf('Description acceptable') == 0){
    text = text.slice(text.indexOf(".")+2);
  }
  return text.trim().replace(/\s{2,}/g, ' ');
}

function extractPrimaryAnswer(answertext){
  bracket_start = answertext.indexOf("[");
  paren_start = answertext.indexOf("(");
  if (paren_start == 0 ){
    answertext = answertext.slice(answertext.indexOf(")")+1);
    paren_start = answertext.indexOf("(");
    bracket_start = answertext.indexOf("[");
  }
  if (bracket_start > -1 && paren_start > -1){
    answertext = answertext.slice(0, Math.min(bracket_start, paren_start)-1);
  }
  else if (bracket_start > -1){
    answertext = answertext.slice(0, bracket_start-1);
  }
  else if (paren_start > -1){
    answertext = answertext.slice(0, paren_start-1);
  }
  return answertext.trim().replace(/\s{2,}/g, ' ');
}

function splitComponent(partext)
{
  var final_par_array = [];
  par_array_1 = partext.replace(/<.*?>/g, "").split(/\[10[emh]?\]/g)
  for(var i=0;i<par_array_1.length;i++){
    if(par_array_1[i].length < 3){continue}
    answerloc = par_array_1[i].indexOf("ANSWER:");
    if (answerloc > 0){
    final_par_array.push(par_array_1[i].slice(0, answerloc));
    final_par_array.push(par_array_1[i].slice(answerloc));
    }
    else{
      final_par_array.push(par_array_1[i]);
    }
  }
  return final_par_array;
}
