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
function processPars(tu_words, tu_chars, bo_words, bo_chars, headerstf){

  var h1 = DocumentApp.ParagraphHeading.HEADING1;
  var h2 = DocumentApp.ParagraphHeading.HEADING2;
  var norm = DocumentApp.ParagraphHeading.NORMAL;

  var all_qs = [];
  var cat = "";
  var answers = [];
  var wordlengths = [];
  var charlengths = [];
  var valid = [];
  var temp_cl = 0;
  var temp_wl = 0;
  var temp_answers = "";
  var question_array = [];
  var is_answer_array = [];
  var bonus_context = false;
  var bonus_answer_counter = 0;
  var bonus_part_regex = /\[10[emh]?\]/g;
  var answer_regex = /ANSWER:/g;

  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  
  var searchType = DocumentApp.ElementType.PARAGRAPH;
  var searchResult = null;

  while (searchResult = body.findElement(searchType, searchResult)) {
    var par = searchResult.getElement().asParagraph();
    var parhead = par.getHeading();
    var partext = removeInstructions(par.getText());
  
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
    else if (parhead != norm && headerstf){
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
      if(q_label == 1 || q_label == 2){
        partext=partext.slice(q_label+2);
      }
      partext_array = splitComponent(partext);
      for(var i=0;i<partext_array.length;i++)
      {
        if (partext_array[i].search(bonus_part_regex)==0){
          if(!bonus_context){
            bonus_context = true;
          }
          question_array.push(removeInstructions(partext_array[i].replace(bonus_part_regex, '')));
          is_answer_array.push(false);
        }
        else if (partext_array[i].search(answer_regex)==0){
          if (bonus_context){
            bonus_answer_counter++;
            question_array.push(extractPrimaryAnswer(partext_array[i].replace(answer_regex, '')));
            is_answer_array.push(true);
            if (bonus_answer_counter==3){
              temp_answers = "";
              temp_cl = 0;
              temp_wl = 0;
              for (var bl = 0; bl<is_answer_array.length;bl++){
                if (is_answer_array[bl]){
                  temp_answers += "/"+question_array[bl];
                }
                else{
                  temp_cl += question_array[bl].length;
                  temp_wl += question_array[bl].split(" ").length;
                }
              }
              answers.push(temp_answers.slice(1));
              charlengths.push(temp_cl);
              wordlengths.push(temp_wl);
              if (temp_cl > bo_chars || temp_wl > bo_words){valid.push("bad");}
              else{valid.push("good");}
              question_array = [];
              is_answer_array = [];
              bonus_context = false;
              bonus_answer_counter = 0;
            }
          }
          else{
              question_array.push(extractPrimaryAnswer(partext_array[i].replace(answer_regex, '')));
              answers.push(question_array[question_array.length-1]);
              temp_cl = 0;
              temp_wl = 0;
              for (var tul = 0;tul<question_array.length-1;tul++){
                temp_cl += question_array[tul].length;
                temp_wl += question_array[tul].split(" ").length;
              }
              charlengths.push(temp_cl);
              wordlengths.push(temp_wl);
              if (temp_cl > tu_chars || temp_wl > tu_words){valid.push("bad");}
              else{valid.push("good");}
              question_array = [];
              is_answer_array = [];
            }
          }
        else{
          question_array.push(removeInstructions(partext_array[i]));
          is_answer_array.push(false);
        }
      }
    }
  }
  all_qs.push({cat: cat, answers: answers, wordlengths: wordlengths, charlengths: charlengths, valid: valid});
  // for(i=all_qs.length-1;i>-1;i--){
  //   if (all_qs[i].answers.length < 1){
  //     all_qs.splice(i, 1);
  //   }
  // }
  return all_qs;
}


function removeInstructions(text){
  var removedtext = text.trim().replace(/\s{2,}/g, ' ').replace(/<.*?>/g, '');
  while (removedtext.indexOf('("') >= 0){
    removedtext = removedtext.slice(0, removedtext.indexOf('("')) + removedtext.slice(removedtext.indexOf('")')+3);
  }
  while (removedtext.indexOf('(“') >= 0){
    removedtext = removedtext.slice(0, removedtext.indexOf('(“')) + removedtext.slice(removedtext.indexOf('”)')+3);
  }
  powermarkloc = removedtext.indexOf("(*)");
  if (powermarkloc >= 0){
    removedtext = removedtext.slice(0, powermarkloc) + removedtext.slice(powermarkloc+4)
  }
  if (removedtext.indexOf('Note to') == 0 || removedtext.indexOf('Description acceptable') == 0){
    removedtext = removedtext.slice(removedtext.indexOf(".")+2);
  }
  return removedtext.trim();
}

function extractPrimaryAnswer(answertext){
  return answertext.replace(/<.*?>/g, '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
}

function splitComponent(partext)
{
  var bonus_part_regex = /\[10[emh]?\]/g, result, indices = [];
  var answer_regex = /ANSWER:/g
  while ( (result = bonus_part_regex.exec(partext)) ){
    indices.push(result.index);
  }   
  while ( (result = answer_regex.exec(partext)) ){
    indices.push(result.index);
  }
  indices.sort();  
  var final_par_array = [];
  for(i=indices.length-1;i>-1;i--){
    final_par_array.push(partext.slice(indices[i]).trim());
    partext = partext.slice(0, indices[i]).trim();
  }
  final_par_array.push(partext.trim());
  for(i=final_par_array.length-1;i>-1;i--){
    if (final_par_array[i].length < 10){
      final_par_array.splice(i,1);
    }
  }
  final_par_array.reverse();
  return final_par_array;
}
