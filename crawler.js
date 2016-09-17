/*

//For browser test only

var targetFrameDocument;
var topLevelFrameSet = document.getElementsByTagName("frameset")[0].getElementsByTagName("*");
for (i=0;i<topLevelFrameSet.length;i++) {
    if (topLevelFrameSet[i].getAttribute) {
        if (topLevelFrameSet[i].getAttribute("src") == "main.php") {
            targetFrameDocument = topLevelFrameSet[i].contentDocument || topLevelFrameSet[i].contentWindow.document;
        }
    }
}

"*/
var _URLPREFIX = "http://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/";
var targetFrameDocument = document;

function syncAjax(url, method) {
    method = method || 'GET';
    var xhttp = new XMLHttpRequest();
    xhttp.open(method, url, false);
    xhttp.send();
    return xhttp;
}

function crawlPronunciation(targetFrameDocument) {
    var result = new Array();
    tableRows = targetFrameDocument.getElementsByTagName("table")[0].getElementsByTagName("tr");
    for (k = 1; k < tableRows.length; k++) {
        var resultRow = {
            consonant: ""
            , vowel: ""
            , tone: ""
            , wav: ""
            , homophone: ""
        };
        var TD = tableRows[k].getElementsByTagName("td");
        //Colnum 1
        var COL1 = TD[0].getElementsByTagName("font");
        for (l = 0; l < COL1.length; l++) {
            if (COL1[l].getAttribute("color") == "red") {
                resultRow["consonant"] += COL1[l].innerHTML;
            }
            if (COL1[l].getAttribute("color") == "green") {
                resultRow["vowel"] += COL1[l].innerHTML;
            }
            if (COL1[l].getAttribute("color") == "blue") {
                resultRow["tone"] += COL1[l].innerHTML;
            }
        }
        //Colnum 2
        resultRow.wav = _URLPREFIX + "sound/" + TD[1].getElementsByTagName("a")[0].getAttribute("href").substr(12) + ".wav";
        //Colnum 3
        resultRow.homophone = TD[2].innerText.replace(/\s+/g, '').replace(/,+/g, '').split("");
        result.push(resultRow);
    }
    return result;
}

function crawlChineseWord(targetFrameDocument) {
    var result = {
        baseInfo: {
            queryCharacter: ""
            , changjie: ""
            , strokes: 0
            , big5: ""
            , radicals: {
                img: ""
                , id: 0
            }
            , pronunciation_type: 0
            , frequency: 0
            , freq_rate: 0
        }
        , list: []
        , words: []
        , reference: {
            unicode: ""
            , dictionary1: "" //漢語大字典
                
            , dictionary2: "" //康熙字典
                
            , matthews: ""
            , mandarin: ""
            , english: ""
        }
    , };
    var sourceListTable, listRows, sourceBaseInfoTable, sourceReferenceTable;
    var sourceResultTables = targetFrameDocument.getElementsByTagName("table");
    for (i = 0; i < sourceResultTables.length; i++) {
        if (sourceResultTables[i].getAttribute) {
            //baseInfo
            if (i == 0 && sourceResultTables[i].getAttribute("border") == "0" && sourceResultTables[i].getAttribute("width") == "100%") {
                sourceBaseInfoTable = sourceResultTables[0];
            }
            //list
            if ((sourceResultTables[i].getAttribute("border") == "1") && (sourceResultTables[i].getElementsByTagName("tr")[0].getElementsByTagName("th").length == 6)) {
                sourceListTable = sourceResultTables[i];
                listRows = sourceListTable.getElementsByTagName("tr");
            }
            //reference
            if (sourceResultTables[i].getAttribute("border") == "0" && sourceResultTables[i].getAttribute("cellspacing") == "5" && sourceResultTables[i].getAttribute("cellpadding") == "5") {
                sourceReferenceTable = sourceResultTables[i];
            }
        }
    }
    //================================================ baseInfo ================================================
    baseInfoTDs = sourceBaseInfoTable.getElementsByTagName("td");
    result.baseInfo.queryCharacter = baseInfoTDs[0].innerText;
    result.baseInfo.radicals.id = baseInfoTDs[2].getElementsByTagName("a")[0].getAttribute("href").substr(16);
    result.baseInfo.radicals.img = _URLPREFIX + baseInfoTDs[2].getElementsByTagName("img")[0].getAttribute("src");
    result.baseInfo.strokes = baseInfoTDs[4].innerText;
    result.baseInfo.pronunciation_type = baseInfoTDs[6].getElementsByTagName("a")[0].getAttribute("href").substr(18);
    result.baseInfo.big5 = baseInfoTDs[9].innerText;
    result.baseInfo.changjie = baseInfoTDs[11].innerText;
    result.baseInfo.freq_rate = baseInfoTDs[13].innerText.replace(/\s+/g, '').split("\/")[0];
    result.baseInfo.frequency = baseInfoTDs[13].innerText.replace(/\s+/g, '').split("\/")[1];
    //================================================ baseInfo ================================================
    //
    //
    //
    //================================================ list ================================================
    for (i = 1; i < listRows.length; i++) {
        var TD = listRows[i].getElementsByTagName("td");
        var resultRow = {
            consonant: ""
            , vowel: ""
            , tone: ""
            , wav: ""
            , origin: ""
            , homophone: ""
            , meaning: ""
        };
        //Colnum 1
        var COL1 = TD[0].getElementsByTagName("font");
        for (j = 0; j < COL1.length; j++) {
            if (COL1[j].getAttribute("color") == "red") {
                resultRow["consonant"] += COL1[j].innerHTML;
            }
            if (COL1[j].getAttribute("color") == "green") {
                resultRow["vowel"] += COL1[j].innerHTML;
            }
            if (COL1[j].getAttribute("color") == "blue") {
                resultRow["tone"] += COL1[j].innerHTML;
            }
        }
        //Colnum 2
        resultRow.wav = _URLPREFIX + "sound/" + TD[1].getElementsByTagName("a")[0].getAttribute("href").substr(12) + ".wav";
        //Colnum 3
        resultRow.origin = TD[2].innerText.split("\n");
        //Colnum 4
        request = syncAjax("http://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/pho-rel.php?s1=" + resultRow["consonant"] + "&s2=" + resultRow["vowel"] + "&s3=" + resultRow["tone"]);
        if (request.status === 200) {
            html = document.createElement("html");
            html.innerHTML = request.responseText;
            resultRow.homophone = crawlPronunciation(html)[0].homophone;
        }
        //Colnum 6
        resultRow.meaning = TD[5].innerText;
        //Output
        result.list.push(resultRow);
    }
    //================================================ list ================================================
    //
    //
    //
    //================================================ words ================================================
    var wordsText = targetFrameDocument.getElementsByTagName("form")[0].innerText;
    result.words = wordsText.substr(wordsText.search("配搭點:") + 4).replace(/\s+/g, '').split("");
    //================================================ words ================================================
    //
    //
    //
    //================================================ reference ================================================
    var hex;
    for (i = 0; i < result.baseInfo.queryCharacter.length; i++) {
        hex = result.baseInfo.queryCharacter.charCodeAt(i).toString(16);
        result.reference.unicode += ("000" + hex).slice(-4);
    }
    referenceTDs = sourceReferenceTable.getElementsByTagName("td");
    result.reference.dictionary1 = referenceTDs[1].innerText;
    result.reference.dictionary2 = referenceTDs[5].innerText;
    result.reference.matthews = referenceTDs[9].innerText;
    result.reference.mandarin = referenceTDs[3].innerText;
    result.reference.english = referenceTDs[7].innerText;
    //================================================ reference ================================================
    return result;
}
