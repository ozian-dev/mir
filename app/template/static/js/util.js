
function callAjax(url, callback, method="GET", data=null) {

    if ( !url.includes(".g=") ) {
        if ( url.includes("?") ) url += "&.g=" + _p["group"];
        else url += "?.g=" + _p["group"];
    }

    $.ajax({
        type : method,
        url : _p["const"]["apiHost"] + url,
        //headers: contentType,
        data : data,
        processData: false,
        contentType: false,
        success : function(res) {
            //try {
                if (res["status"] == "ok") {
                    callback(res);
                } else {
                    if (res["msg"].indexOf("auth error") >= 0 ) {
                        location.href = "/login";
                    } else { 
                        modal("server error<hr>" + res["msg"], false);
                    }
                }
            //} catch (exception_var) {
            //    modal("Error.<hr>" + exception_var + "<hr>" + res);
            //}
        },
        error : function(XMLHttpRequest, textStatus, errorThrown) { 
            alert("API call error")
        }
    });
}

function getPanelObj(obj) {

    if ($(obj).length == 0) return null;

    if ( $(obj).hasClass("panel")) return obj;
    else return getPanelObj($(obj).parent());
}


function getpanelResValue(obj, target, row, key) {

    var heads = obj["chart"]["heads"];
    var values = obj["chart"]["values"];

    var index = heads.findIndex(obj => obj.name === key);

    return values[row][index];
}


/*
entity : form, chart, ...
mode : operate, execute, insert,
target : target-name
extType : in operate case : table, arrange, select
*/
function getLinkObj(obj, style, entity, mode, target, type="",  html="", extCls="", extData={}){

    var linkObj = $("<a>").addClass("fnc-link")
        .addClass("att-" + style)
        .addClass(extCls)
        .attr("href", "#")
        .attr("title", (html ? html : target))
        .attr("data-g", $(obj).attr("data-g"))
        .attr("data-i", $(obj).attr("data-i"))
        .attr("data-entity", entity)
        .attr("data-mode", mode)
        .attr("data-target", target)
        .attr("data-type", type)
        .html(html);

    $.each(extData, function(k,v){
        $(linkObj).attr("data-" + k, v);
    })

    return linkObj;
}

function getPostData ( mainObj, btnObj, dataObj, diffOnly=true, row="" ) {

    var postData = {};

    postData["g"] = $(btnObj).attr("data-g"); if ( !postData["g"]) postData["g"] = $(mainObj).attr("data-g");
    postData["i"] = $(btnObj).attr("data-i"); if ( !postData["i"]) postData["i"] = $(mainObj).attr("data-i");

    postData["entity"] = $(btnObj).attr("data-entity"); // chart, form -> entity type
    postData["mode"] = $(btnObj).attr("data-mode"); // execute, insert, flow -> sub-entity type in entity type  
    postData["target"] = $(btnObj).attr("data-target");
    postData["run"] = $(btnObj).attr("data-run"); // real, test
    postData["forward"] = $(btnObj).attr("data-forward");
    postData["@data"] = collectData(dataObj, diffOnly, row, $(btnObj).attr("data-force")); // data["new"], data["old"], data["sql"]

    postData["@custom"] = {}
    $.each($(mainObj).find(".search .custom .item .value .att-input"), function(i, item){
        postData["@custom"][$(item).attr("data-name")] = $(item).attr("data-value");
    });
  
    if ( postData["@data"] == null ) return null;

    if (postData["@data"]["new"][0]) {
        var keys = {} ;
        if( postData["entity"] == "chart" && postData["mode"] == "execute" ) {
            keys= _p["p"]["i"][postData["i"]]["chart"]["execute"][postData["target"]]["data-keys"];
        }
        if (keys) {
            Object.assign(postData["@data"]["old"][0], keys); 
            Object.assign(postData["@data"]["new"][0], keys);
        }
    }

    return postData;
}

function collectData(obj, diffOnly=true, row="", force) {

    var tarObj = (row == "" ? obj : $(obj).find(row)) ;
    var newArr = [];
    var oldArr = [];
    var isValid = true;
    var valCnt = 0;

    $(tarObj).each( function(r, row) {
        
        if ( !isValid ) return false;

        var dataObj = $(row).find(".att-input:visible");
        var thisNew = {};
        var thisOld = {};
        var isSame = true;

        $(dataObj).each(function(i, item) {

            if ( !isValid ) return false;

            if ( !$(item).attr("data-step") && $(item).attr("data-name") ) {
                if($(item).hasClass("required")) {
                    if ( !$(item).attr("data-value") || $(item).attr("data-value") == "" ) {
                        modal(_m[_l]["required"] + " : " + $(item).attr("data-alias"), false);
                        $(item).focus();
                        isValid = false;
                        return false;
                    }
                }

                if ( $(item).parent().parent().attr("data-org") ) {
                    thisOld[$(item).attr("data-name")] = $(item).parent().parent().attr("data-org");
                } else {
                    if ( $(item).parent().parent().attr("data-default-null") === "" )
                        thisOld[$(item).attr("data-name")] = null;
                    else thisOld[$(item).attr("data-name")] = "";
                }

                if ( $(item).attr("data-value") ) {
                    thisNew[$(item).attr("data-name")] = $(item).attr("data-value") ;
                } else {
                    if ( $(item).parent().parent().attr("data-default-null") === "" )
                        thisNew[$(item).attr("data-name")] = null;
                    else thisNew[$(item).attr("data-name")] = "";        
                }

                if (diffOnly && isSame && thisOld[$(item).attr("data-name")] != thisNew[$(item).attr("data-name")]) isSame = false;
                else if ($(item).attr("data-change") == "1") isSame = false;
            }

            valCnt++;
        });

        if ( !isValid ) return;
        
        var dataKeyObj = $(row).find(".att-key");
        $(dataKeyObj).each(function(i, item) {

            thisNew[$(item).attr("data-name")] = $(item).attr("data-org") ? $(item).attr("data-org") : "";
            thisOld[$(item).attr("data-name")] = thisNew[$(item).attr("data-name")];
        });

        if ( force === "1" || (!diffOnly || !isSame) ) {
            newArr.push(thisNew); 
            oldArr.push(thisOld); 
        } 
    })
    
    if ( !isValid ) return null;
    if ( valCnt == 0 && force !== "1") return {"new":[], "old":[]};

    if ( newArr.length == 0 ) {
        modal(_m[_l]["nochange"]);
        return null;
    }

    return {"new":newArr, "old":oldArr};
}


function switchKeyVal(obj, keys = []) {
    
    var result = {};
    for (var key in obj) {
        var newKeys = keys.concat([key]);
        if (typeof obj[key] === "object") {
            var nestedObj = switchKeyVal(obj[key], newKeys);
            result = { ...result, ...nestedObj };
        } else {
            var newKey = obj[key];
            result[newKey] = newKeys;
        }
    }
    return result;
}

function getValFromArr(arr, name) {
    return arr.find(o => o["name"] === name);
}

function transpose(arr) {
    
    if (!arr || arr.length == 0) return arr;

    var result = Array.from({ length: arr[0].length }, () => []);

    arr.forEach((row, i) => {
        row.forEach((value, j) => {
            result[j][i] = value;
        });
    });

    return result;
}

function sortArr(arr, pos, order) {

    for(i=0;i<arr.length;i++) {
        for(j=i;j<arr.length;j++) {
            if ( order == 'asc') {
                if (arr[i][pos]>arr[j][pos]) {
                    var tmp = arr[i] ;
                    arr[i] = arr[j];
                    arr[j] = tmp;
                }
            } else {
                if (arr[i][pos]<arr[j][pos]) {
                    var tmp = arr[i] ;
                    arr[i] = arr[j];
                    arr[j] = tmp;
                }
            }
        }
    }
    return arr;
}

function isNumeric(value) {
    return /^-?\d+(\.\d+)?$/.test(value);
}

function getFormatTime() {
    var now = new Date(); // 현재 날짜 및 시간 객체 생성
    var hours = now.getHours(); // 시 추출
    var minutes = now.getMinutes(); // 분 추출
    var seconds = now.getSeconds(); // 초 추출

    // 10 미만의 숫자 앞에 0 추가
    var formattedHours = hours < 10 ? `0${hours}` : hours;
    var formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    var formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    var timeString = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    return timeString;
}

function numberFormat(number, decimals = null, thousands_sep = ",", dec_point = ".") {
    
    if (decimals === -1) {
        thousands_sep = "";
        decimals = 0;
    }

    number = parseFloat(number);

    if (!isFinite(number) || (!number && number !== 0)) {
        return '';
    }

    var stringifiedNumber;
    if (decimals === null) {
        stringifiedNumber = Math.abs(number).toString();
    } else {
        stringifiedNumber = Math.abs(number).toFixed(decimals);
    }

    var parts = stringifiedNumber.split('.');
    var integerPart = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + thousands_sep);
    var decimalPart = parts[1] !== undefined ? dec_point + parts[1] : '';

    return (number < 0 ? '-' : '') + integerPart + decimalPart;
}


function trgFnext (obj) {

    var col = $("#pop2").attr("data-target");
    var values = _p["p"]["i"][$("#pop1").attr("data-i")]["chart"]["heads"][col]["values"]["data"];

    var selectObj = $(obj).parent().parent();
    var tabSize = parseInt($(selectObj).attr("data-tab-size"));
    var thisTabSeq = parseInt($(obj).parent().attr("data-seq"));

    var nextTabSeq = thisTabSeq + 1;
    var nextTabObj = $(selectObj).find(".tab").eq(nextTabSeq);

    if ( $(nextTabObj).length > 0 ) {
        var cur = values;
        for(var i=0; i<nextTabSeq; i ++ ) {
            var thisVal = selectObj.find(".tab").eq(i).find(".att-selected-item").attr("data-value");
            cur = cur[thisVal];
        }
        $(nextTabObj).html("");
        $.each(cur, function(k,v){
            var item ;
            if(v instanceof Object)
                item = $("<a>").addClass("fnc-select-one").attr("href","#").attr("data-value", k).attr("data-trigger","trgFnext").html(k);
            else 
                item = $("<a>").addClass("fnc-select-one fnc-select-multi-add").attr("href","#").attr("data-value", v).html(k);

            $(nextTabObj).append(item);       
        })
        for(var i=nextTabSeq+1; i<tabSize; i++ ) {
            $(selectObj).find(".tab").eq(i).html("");
        }
    }
}


// set function
////////////////////////////////////////////////////////////////////

function trans2obj (obj) {
    /*
    final_res["meta"]["trans_obj"] = [
        "obj.chart.execute",
        "obj.chart.execute.*.columns",
        "obj.chart.insert.columns",
        "obj.chart.heads",
        "obj.chart.ops",
        "obj.form.items"
    ]
    */
    var tarPath;
    if ( obj["meta"] && obj["meta"]["trans_obj"] ) tarPath = obj["meta"]["trans_obj"];
    if (!tarPath) return;

    $.each(tarPath, function(i, path) {
        try {
            if (path.includes(".*")) {
                var midPath = path.split(".*")[0];
                var endPath = path.split(".*")[1];
                if ( eval(midPath) ) {
                    var midObj = eval (midPath);
                    $.each(midObj, function(k, v){
                        var finalPath = midPath + "['" + k.replace(/'/g, "\\'") + "']" + endPath;
                        var orders = eval(finalPath + "_orders = []");
                        var tarObj = eval(finalPath);
                        var resObj = {};
                        $.each(tarObj, function(j, row) {
                            resObj[row["name"]] = row;
                            orders.push(row["name"]);
                        })
                        eval(finalPath + "= resObj" );
                    })
                }
            } else if(eval(path)) {
                var orders = eval(path + "_orders = []");
                var tarObj = eval(path);
                var resObj = {};
                $.each(tarObj, function(j, row) {
                    resObj[row["name"]] = row;
                    orders.push(row["name"]);
                })
                eval(path + "= resObj" );
            }
        } catch(e) {}
    })
}

function setPanelInfo(obj) {

    var pInfo = JSON.parse(JSON.stringify(obj));
    if (pInfo["chart"] && pInfo["chart"]["values"]) delete(pInfo["chart"]["values"]);

    trans2obj(pInfo);

    if ( pInfo["chart"] ) {
        // 0:disable, 1:ready, 2:activated
        pInfo["chart"]["tools"] = {};
        pInfo["chart"]["tools"]["operate"] = 0;
        pInfo["chart"]["tools"]["execute"] = 0;
        if ( pInfo["chart"]["operate"] ) pInfo["chart"]["tools"]["operate"] = 1;

        if (pInfo["chart"]["type"] && pInfo["chart"]["type"] == "table") {
            if (pInfo["chart"]["heads_orders"]) {
                for (var i=0; i<pInfo["chart"]["heads_orders"].length; i++) {
                    var headName = pInfo["chart"]["heads_orders"][i];
                    var info = pInfo["chart"]["heads"][headName];
                    if (info["values"] && info["values"]["data"]) {
                        pInfo["chart"]["heads"][headName]["values"]["data_rev"] 
                            = switchKeyVal(info["values"]["data"]);
                    }
                }
            }
        }

    }

    _p["p"]["i"][obj["pid"]] = pInfo;
}


function ScrollTrigger(id, options) {

    var limit = 80;
    var panelObj = $("#" + id);
    var scrollObject = $(panelObj).find(".chart .chart-table"); 
    var innerObject = $(scrollObject).find(".table");

    var isCalling = false;
    var isLast = false;

    $(scrollObject).on ("scroll", function() {
        scrollHandle();
    })

    function scrollHandle(e) {
        if ( ( $(innerObject).height() - $(scrollObject).scrollTop() - $(scrollObject).height() ) < limit ) {
            callMore();
        }
    }

    function callMore() {

        if ( isLast ) return;
        if ( isCalling ) return;

        isCalling = true;

        var queryStr = getHashParams()[parseInt($(panelObj).attr("data-seq"))];

        var url = _p["const"]["panel"] 
            + "?.g=" + $(panelObj).attr("data-g")
            + "&.i=" + $(panelObj).attr("data-i");

        var pid = $(panelObj).attr("data-i");
        var columns = _p["p"]["i"][pid]["chart"]["heads"];

        $.each(options["keys"], function(i, item){
            itemLast = $(innerObject).find("tr.row").last().find("[data-name='"+item+"']").attr("data-org");
            if ( queryStr != "" ) url += "&" + queryStr ;
            url += "&" + item + "=" + itemLast ;
        })

        callAjax(url, function(obj) {
            var lines = renderFnc["tableLine"](panelObj, obj);
            $(innerObject).find("tr.row").last().after(lines);

            renderFnc["tableSummary"](panelObj);

            if ( !obj["chart"]["values"] || options["size"] > obj["chart"]["values"].length ) isLast = true;
            isCalling = false;
        });
    }
}

function findObjWithKey(jsonObj, targetKey = "sql") {
    const objectsWithSql = [];

    function findObjectsRecursively(obj) {
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    if (key === targetKey && (typeof value === 'string' || Array.isArray(value))) {
                        objectsWithSql.push(obj);
                    }
                    if (typeof value === 'object' && value !== null) {
                        findObjectsRecursively(value);
                    }
                }
            }
        } else if (Array.isArray(obj)) {
            for (const item of obj) {
                findObjectsRecursively(item);
            }
        }
    }

    findObjectsRecursively(jsonObj);
    return objectsWithSql;
}




/* json editor *
/* ----------------------------------------------- */

var editorJson;
var editorSql;
var sqlEditLineNum;
var sqlEditQueryOrg;

function callJsonEditor(target) {

    editorJson = ace.edit(target);
    editorJson.getSession().setMode("ace/mode/json");
    editorJson.setTheme("ace/theme/tomorrow");
    editorJson.getSession().setTabSize(4);
    editorJson.getSession().setUseWrapMode(true);

    try {
        var jsonData = editorJson.getValue();
        var format = JSON.stringify(JSON.parse(jsonData), null, 4);
        editorJson.setValue(format+"\n\n\n");
    } catch (e) { modal("invalid json:<br/>" + e, false); return; }

    var firstLine = editorJson.getSession().getDocument().getLine(0);
    editorJson.gotoLine(1, 0, true);

    editorJson.on("guttermousedown", function(e){if(e.getDocumentPosition().row === 0){}});
    editorJson.on("dblclick", function(e) {

        var candidate = "" ;
        var pos = e.getDocumentPosition();
        var line = editorJson.session.getLine(pos.row).trim();
        if (line.charAt(line.length - 1) === ',') line = line.slice(0, -1);

        var jsonObj = null;
        try {
            str = "[" + line + "]";
            jsonObj = JSON.parse(str);
            candidate = jsonObj[0];
        } catch (e1) {
            try {
                str = "{" + line + "}";
                jsonObj = JSON.parse(str);
                candidate = jsonObj[Object.keys(jsonObj)[0]];
            } catch (e2) {}
        }
        if( jsonObj && "info" in jsonObj ) {

            var info = { "pos": pos, "line": line };
            renderPop3(jsonObj["info"], "markdown", info);
            return ;
        }
    
        if ( candidate != "" ) {

            try {
                var count = (candidate.match(/select|from|insert|into|update|set|delete|where|call/gi)||[]).length;
                if (count>1) {
                    sqlEditLineNum = pos.row;
                    sqlEditQueryOrg = candidate;

                    var fullObj = JSON.parse(editorJson.getValue());
                    var queryLists = findObjWithKey(fullObj, "query");
                    var seed = candidate.toLowerCase().replaceAll(" ", "").trim();
                    var datasource = fullObj["datasource"];

                    for (var i=0 ; i<queryLists.length ; i++ ) {

                        item = queryLists[i];
                        if (typeof item["query"] === "string") {

                            if ( item["query"].toLowerCase().replaceAll(" ", "").trim() === seed ) {
                                if ( item["datasource"] ) {
                                    datasource = item["datasource"];
                                    break;
                                }
                            }
                        } else {
                            
                            for (var j=0 ; j<item["query"].length ; j++ ) {

                                if ( item["query"][j].toLowerCase().replaceAll(" ", "").trim() .trim() === seed ) {
                                    if ( item["datasource"] ) {
                                        datasource = item["datasource"];
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    if (datasource) {
                        var url = _p["const"]["datasource"] + datasource;
                        callAjax ( url, function(resObj) {
                            var db_info = {"idx": datasource, "type":resObj["type"]}; 
                            renderPop3(sqlEditQueryOrg, "sql", db_info);
                        });
                    } else {
                        var db_info = {"idx": null, "type":"mysql"}; 
                        renderPop3(sqlEditQueryOrg, "sql", db_info);
                    }
                } else {
                    sqlEditLineNum = -1;
                    sqlEditQueryOrg = "";       
                }
            } catch (e3) {}
        } else {
            sqlEditLineNum = -1;
            sqlEditQueryOrg = "";
        }
    });
}

function callSqlEditor(target, sql, info) {

    editorSql = ace.edit(target);
    editorSql.getSession().setMode("ace/mode/sql");
    editorSql.setTheme("ace/theme/tomorrow");
    editorSql.getSession().setTabSize(4);
    editorSql.getSession().setUseWrapMode(true);

    try {
        editorSql.setValue( getFormattedSql(sql, info["type"]) );
        
    } catch (e) { modal("invalid sql:<br/>" + e, false); return; }

    var firstLine = editorSql.getSession().getDocument().getLine(0);
    editorSql.gotoLine(1, 0, true);
    editorSql.on("guttermousedown", function(e){if(e.getDocumentPosition().row === 0){}});
}

function escapeSqlFormater (mode, sql) {
    if ( mode == "encode") {

        sql = sql.split("[[[").join("___square_start___");
        sql = sql.split("]]]").join("___square_end___");

        sql = sql.split("#{@").join("___macro_type1_start___");
        sql = sql.split("#{") .join("___macro_type2_start___");
        sql = sql.split("${@").join("___macro_type3_start___");
        sql = sql.split("${") .join("___macro_type4_start___");
        sql = sql.split("}")  .join("___macro_end___");

        sql = sql.split("&lt;").join("<");

        sql = sql
            .replace(/<(\w+)([^>]*)>/g, '___$1$2___')
            .replace(/<\/(\w+)>/g, '___backslash$1___'); 
   
    } else {

        sql = sql.split("___square_start___").join("[[[");
        sql = sql.split("___square_end___").join("]]]");

        sql = sql.split("___macro_type1_start___").join("#{@");
        sql = sql.split("___macro_type2_start___").join("#{");
        sql = sql.split("___macro_type3_start___").join("${@");
        sql = sql.split("___macro_type4_start___").join("${");
        sql = sql.split("___macro_end___")        .join("}");

        sql = sql.replace(/\[\[\[\n\s+/g, "[[[ ");

        sql = sql
            .replace(/___backslash(.*?)___/g, '\n</$1>')
            .replace(/___(.*?)___/g, '\n<$1>');

        sql = sql.trim();

    }
    return sql;
}

function getFormattedSql(sql, db="mariadb") {

    var formattedSql = escapeSqlFormater ("encode", sql);
    try {
        formattedSql = sqlFormatter.format(formattedSql, {'keywordCase':'upper', 'language':db});
    } catch (e) { 
        if ( db == "mariadb") {
            formattedSql = sqlFormatter.format(formattedSql, {'keywordCase':'upper', 'language':'sql'});
        }
    }
    formattedSql = escapeSqlFormater ("decode", formattedSql);
    return formattedSql + "\n\n\n";
}

function getHtmlEntity(str) {
    if (!str) return str;
    if (typeof str === "string") {
        return str.replace(/</g, "&lt;");
    } else {
        return str;
    }
}


function getTableFromJson (jsonData) {
    
    if (jsonData.length < 1) return "" ;

    var keys = Object.keys(jsonData[0]);

    var table = $("<table>").addClass("table-in-pre");

    var tr = $("<tr>");
    for (var k of keys) {
        var th = $("<th>").html(getHtmlEntity(k));
        $(tr).append(th);
    }
    $(table).append(tr);

    for (var row of jsonData) {
        var tr = $("<tr>");
        for (var col in row) {
            var td = $("<td>").html(getHtmlEntity(row[col]));
            
            $(tr).append(td);
        }
        $(table).append(tr);
    }

    return $(table).prop("outerHTML");
}


